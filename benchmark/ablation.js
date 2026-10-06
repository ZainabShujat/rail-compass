// benchmark/ablation.js
// ═══════════════════════════════════════════════════════════════════
// ABLATION ANALYSIS
//
// Tests the effect of removing individual components of the
// RailCompass adaptive scoring algorithm.
//
// Ablation variants:
//   A0: Full RailCompass (baseline — unchanged)
//   A1: No branch adaptation (use short-journey weights for ALL)
//   A2: No premium bonus (remove +18 for long-haul premium)
//   A3: No unorthodox penalty (remove −15 for early arrivals)
//   A4: No overnight redistribution (keep food weight for overnight)
//   A5: No daytime drop on long journeys (keep daytime in long formula)
//
// Each variant re-implements the scoring with exactly ONE component
// removed, then compares against the full RailCompass baseline.
//
// Usage:
//   node benchmark/ablation.js
//
// Output:
//   benchmark/results/ablation_raw.json
//   benchmark/results/ablation_tables.txt
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { initData, stationsMap, trainsMap, schedulesByTrain, stationToTrains, getStationCodes } from '../backend/utils/dataLoader.js';
import { calculateSmartScore, getMetricsForType } from '../backend/utils/smartScore.js';

import { ROUTES, TOP_K } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resultsDir = path.join(__dirname, 'results');

// ── Helpers (same as run_benchmark.js) ────────────────────────────
const timeToMins = (timeStr) => {
  if (!timeStr || timeStr === 'None') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h * 60) + m;
};

const calculateDurationMins = (startDay, startTime, endDay, endTime) => {
  const sDay = startDay || 1;
  const eDay = endDay || 1;
  const sTime = timeToMins(startTime);
  const eTime = timeToMins(endTime);
  let totalMins = (eDay - sDay) * 24 * 60;
  totalMins += (eTime - sTime);
  return totalMins > 0 ? totalMins : 0;
};

const calculateDaytimeHours = (startDay, startTime, endDay, endTime) => {
  const sDay = startDay || 1;
  const eDay = endDay || 1;
  const sTimeHour = timeToMins(startTime) / 60;
  const eTimeHour = timeToMins(endTime) / 60;
  const dep = ((sDay - 1) * 24) + sTimeHour;
  const arr = ((eDay - 1) * 24) + eTimeHour;
  let daytimeHours = 0;
  for (let d = 0; d <= Math.max(sDay, eDay) + 1; d++) {
    const startDayTime = (d * 24) + 8;
    const endDayTime = (d * 24) + 20;
    const overlapStart = Math.max(dep, startDayTime);
    const overlapEnd = Math.min(arr, endDayTime);
    if (overlapStart < overlapEnd) daytimeHours += (overlapEnd - overlapStart);
  }
  return daytimeHours;
};

const formatDuration = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const getDummyPrices = (durMins, trainType, trainDetails) => {
  let prices = {};
  const avgSpeed = 65;
  const approxDistance = Math.max(50, (durMins / 60) * avgSpeed);
  const availableClasses = [];
  if (trainDetails) {
    if (Number(trainDetails.sleeper) > 0) availableClasses.push('SL');
    if (Number(trainDetails.third_ac) > 0) availableClasses.push('3AC');
    if (Number(trainDetails.second_ac) > 0) availableClasses.push('2AC');
    if (Number(trainDetails.first_ac) > 0) availableClasses.push('1AC');
    if (Number(trainDetails.chair_car) > 0) availableClasses.push('CC');
    if (trainDetails.classes && trainDetails.classes.includes('EC')) availableClasses.push('EC');
    if (trainDetails.classes && trainDetails.classes.includes('CC') && !availableClasses.includes('CC')) availableClasses.push('CC');
  } else {
    availableClasses.push('SL', '3AC', '2AC');
  }
  const baseRate = { 'SL': 0.65, '3AC': 1.65, '2AC': 2.45, '1AC': 3.60, 'CC': 1.45, 'EC': 2.90 };
  const resCharge = { 'SL': 20, '3AC': 40, '2AC': 50, '1AC': 60, 'CC': 40, 'EC': 60 };
  const sfCharge = { 'SL': 30, '3AC': 45, '2AC': 45, '1AC': 75, 'CC': 45, 'EC': 75 };
  const isPremium = ['Rajdhani', 'Shatabdi', 'Tejas', 'Vande Bharat'].includes(trainType);
  const isSuperfast = isPremium || trainType === 'Superfast';
  const premiumMultiplier = isPremium ? 1.35 : 1.0;
  const cateringCharge = { 'SL': 0, '3AC': 150, '2AC': 150, '1AC': 250, 'CC': 150, 'EC': 250 };
  for (let cls of availableClasses) {
    if (!baseRate[cls]) continue;
    let fare = approxDistance * baseRate[cls] * premiumMultiplier;
    fare += resCharge[cls];
    if (isSuperfast) fare += sfCharge[cls];
    if (isPremium) fare += cateringCharge[cls];
    if (cls !== 'SL') { fare = fare * 1.05; }
    prices[cls] = Math.ceil(fare / 5) * 5;
    if (cls === 'SL' && prices[cls] < 120) prices[cls] = 120;
    if (cls === '3AC' && prices[cls] < 450) prices[cls] = 450;
    if (cls === '2AC' && prices[cls] < 700) prices[cls] = 700;
    if (cls === '1AC' && prices[cls] < 1200) prices[cls] = 1200;
    if (cls === 'CC' && prices[cls] < 350) prices[cls] = 350;
    if (cls === 'EC' && prices[cls] < 700) prices[cls] = 700;
  }
  return prices;
};

// ── Train retrieval (identical to run_benchmark.js) ──────────────
function retrieveTrains(originQuery, destQuery, preferredClass) {
  const originCodes = getStationCodes(originQuery);
  const destCodes = getStationCodes(destQuery);
  if (originCodes.length === 0 || destCodes.length === 0) return [];

  const candidateTrains = new Set();
  for (const oCode of originCodes) {
    const trains = stationToTrains[oCode];
    if (trains) for (const t of trains) candidateTrains.add(t);
  }

  let results = [];
  for (const tNum of candidateTrains) {
    const schedule = schedulesByTrain[tNum];
    if (!schedule) continue;
    const oIndices = [];
    const dIndices = [];
    schedule.forEach((s, idx) => {
      if (originCodes.includes(s.station_code)) oIndices.push({ idx, code: s.station_code });
      if (destCodes.includes(s.station_code)) dIndices.push({ idx, code: s.station_code });
    });
    if (oIndices.length === 0 || dIndices.length === 0) continue;
    let bestPair = null;
    for (const o of oIndices) {
      for (const d of dIndices) {
        if (o.idx < d.idx) {
          if (!bestPair || (d.idx - o.idx < bestPair.d.idx - bestPair.o.idx)) bestPair = { o, d };
        }
      }
    }
    if (bestPair) {
      const oStop = schedule[bestPair.o.idx];
      const dStop = schedule[bestPair.d.idx];
      const trainDetails = trainsMap[tNum];
      const depTime = oStop.departure !== 'None' ? oStop.departure : oStop.arrival;
      const arrTime = dStop.arrival !== 'None' ? dStop.arrival : dStop.departure;
      if (!depTime || !arrTime || depTime === 'None' || arrTime === 'None') continue;
      const durMins = calculateDurationMins(oStop.day, depTime, dStop.day, arrTime);
      const daytime = calculateDaytimeHours(oStop.day, depTime, dStop.day, arrTime);
      let trainType = trainDetails?.type || 'Express';
      if (trainDetails?.name) {
        const tname = trainDetails.name.toLowerCase();
        if (tname.includes('vande bharat')) trainType = 'Vande Bharat';
        else if (tname.includes('rajdhani')) trainType = 'Rajdhani';
        else if (tname.includes('shatabdi')) trainType = 'Shatabdi';
        else if (tname.includes('tejas')) trainType = 'Tejas';
        else if (tname.includes('sf') || tname.includes('superfast')) trainType = 'Superfast';
        else if (tname.includes('mail')) trainType = 'Mail';
      }
      results.push({
        _id: tNum, trainNumber: tNum,
        trainName: trainDetails?.name || oStop.train_name,
        departureStation: stationsMap[bestPair.o.code.toLowerCase()]?.name || bestPair.o.code,
        arrivalStation: stationsMap[bestPair.d.code.toLowerCase()]?.name || bestPair.d.code,
        departureTime: depTime.substring(0, 5), arrivalTime: arrTime.substring(0, 5),
        durMins, daytime, duration: formatDuration(durMins),
        type: trainType,
        prices: getDummyPrices(durMins, trainType, trainDetails),
        availableSeats: 100,
        isDedicatedRoute: (bestPair.o.idx === 0 && bestPair.d.idx === schedule.length - 1)
      });
    }
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════════
//  ABLATION SCORING VARIANTS
//
//  Each function takes the same processed trains list and returns
//  ranked results with aiScore. The differences from the full
//  RailCompass are documented inline.
// ═══════════════════════════════════════════════════════════════════

function rankWithAblation(trainsList, preferredClass, ablationId) {
  if (!trainsList || trainsList.length === 0) return [];

  // Step 1: Apply calculateSmartScore to get metrics + budgetPrice
  let processed = trainsList.map(t => calculateSmartScore(t, {}, preferredClass));

  // Step 2: Normalization
  const minDur = Math.min(...processed.map(t => t.durMins));
  const maxDur = Math.max(...processed.map(t => t.durMins));
  const minDaytime = Math.min(...processed.map(t => t.daytime));
  const maxDaytime = Math.max(...processed.map(t => t.daytime));
  const minPrice = Math.min(...processed.map(t => t.budgetPrice));
  const maxPrice = Math.max(...processed.map(t => t.budgetPrice));

  processed = processed.map(t => {
    const durationScore = maxDur === minDur ? 100 : 100 - (((t.durMins - minDur) / (maxDur - minDur)) * 100);
    const daytimeScore = maxDaytime === minDaytime ? 100 : 100 - (((t.daytime - minDaytime) / (maxDaytime - minDaytime)) * 100);
    const budgetScore = maxPrice === minPrice ? 100 : 100 - (((t.budgetPrice - minPrice) / (maxPrice - minPrice)) * 100);
    const reliabilityScore = t.metrics.reliabilityRating * 10;
    const comfortScore = t.metrics.comfortRating * 10;
    const foodScore = t.metrics.foodRating === "NA" ? 50 : (t.metrics.foodRating * 10);

    let finalScore = 0;
    let matchReason = "Solid all-around option";

    // Check unorthodox arrival
    let isUnorthodox = false;
    if (t.arrivalTime) {
      const [arrH] = t.arrivalTime.split(':').map(Number);
      if (arrH >= 1 && arrH < 6) isUnorthodox = true;
    }

    const isShort = t.durMins <= 10 * 60;

    // Check overnight-no-pantry
    let isOvernightNoPantry = false;
    if (t.departureTime && t.arrivalTime) {
      const [depH] = t.departureTime.split(':').map(Number);
      const [arrH] = t.arrivalTime.split(':').map(Number);
      if ((depH >= 21 || depH <= 3) && arrH <= 11) isOvernightNoPantry = true;
    }

    const isPremium = ['Rajdhani', 'Shatabdi', 'Tejas', 'Vande Bharat'].includes(t.type);

    // ── A0: Full RailCompass (baseline) ──────────────────────
    if (ablationId === 'A0') {
      if (isShort) {
        if (isOvernightNoPantry) {
          finalScore = (durationScore * 0.35) + (daytimeScore * 0.25) + (budgetScore * 0.20) +
                       (reliabilityScore * 0.10) + (comfortScore * 0.10);
        } else {
          finalScore = (durationScore * 0.35) + (daytimeScore * 0.25) + (budgetScore * 0.20) +
                       (reliabilityScore * 0.10) + (comfortScore * 0.05) + (foodScore * 0.05);
        }
        if (isUnorthodox) finalScore -= 15;
      } else {
        finalScore = (durationScore * 0.35) + (comfortScore * 0.25) + (budgetScore * 0.15) +
                     (foodScore * 0.15) + (reliabilityScore * 0.10);
        if (isPremium) finalScore += 18;
      }
    }

    // ── A1: No branch adaptation (always use short-journey formula) ──
    else if (ablationId === 'A1') {
      // Always use the standard short-journey formula, regardless of duration
      if (isOvernightNoPantry) {
        finalScore = (durationScore * 0.35) + (daytimeScore * 0.25) + (budgetScore * 0.20) +
                     (reliabilityScore * 0.10) + (comfortScore * 0.10);
      } else {
        finalScore = (durationScore * 0.35) + (daytimeScore * 0.25) + (budgetScore * 0.20) +
                     (reliabilityScore * 0.10) + (comfortScore * 0.05) + (foodScore * 0.05);
      }
      if (isUnorthodox) finalScore -= 15;
      // No premium bonus either, since that's a long-journey feature
    }

    // ── A2: No premium bonus (remove +18 for long-haul premium) ──
    else if (ablationId === 'A2') {
      if (isShort) {
        if (isOvernightNoPantry) {
          finalScore = (durationScore * 0.35) + (daytimeScore * 0.25) + (budgetScore * 0.20) +
                       (reliabilityScore * 0.10) + (comfortScore * 0.10);
        } else {
          finalScore = (durationScore * 0.35) + (daytimeScore * 0.25) + (budgetScore * 0.20) +
                       (reliabilityScore * 0.10) + (comfortScore * 0.05) + (foodScore * 0.05);
        }
        if (isUnorthodox) finalScore -= 15;
      } else {
        finalScore = (durationScore * 0.35) + (comfortScore * 0.25) + (budgetScore * 0.15) +
                     (foodScore * 0.15) + (reliabilityScore * 0.10);
        // REMOVED: if (isPremium) finalScore += 18;
      }
    }

    // ── A3: No unorthodox penalty (remove −15) ──
    else if (ablationId === 'A3') {
      if (isShort) {
        if (isOvernightNoPantry) {
          finalScore = (durationScore * 0.35) + (daytimeScore * 0.25) + (budgetScore * 0.20) +
                       (reliabilityScore * 0.10) + (comfortScore * 0.10);
        } else {
          finalScore = (durationScore * 0.35) + (daytimeScore * 0.25) + (budgetScore * 0.20) +
                       (reliabilityScore * 0.10) + (comfortScore * 0.05) + (foodScore * 0.05);
        }
        // REMOVED: if (isUnorthodox) finalScore -= 15;
      } else {
        finalScore = (durationScore * 0.35) + (comfortScore * 0.25) + (budgetScore * 0.15) +
                     (foodScore * 0.15) + (reliabilityScore * 0.10);
        if (isPremium) finalScore += 18;
      }
    }

    // ── A4: No overnight redistribution (keep food in overnight formula) ──
    else if (ablationId === 'A4') {
      if (isShort) {
        // Always use the standard 6-weight formula, even for overnight
        finalScore = (durationScore * 0.35) + (daytimeScore * 0.25) + (budgetScore * 0.20) +
                     (reliabilityScore * 0.10) + (comfortScore * 0.05) + (foodScore * 0.05);
        if (isUnorthodox) finalScore -= 15;
      } else {
        finalScore = (durationScore * 0.35) + (comfortScore * 0.25) + (budgetScore * 0.15) +
                     (foodScore * 0.15) + (reliabilityScore * 0.10);
        if (isPremium) finalScore += 18;
      }
    }

    // ── A5: No daytime drop on long journeys (keep daytime weight) ──
    else if (ablationId === 'A5') {
      if (isShort) {
        if (isOvernightNoPantry) {
          finalScore = (durationScore * 0.35) + (daytimeScore * 0.25) + (budgetScore * 0.20) +
                       (reliabilityScore * 0.10) + (comfortScore * 0.10);
        } else {
          finalScore = (durationScore * 0.35) + (daytimeScore * 0.25) + (budgetScore * 0.20) +
                       (reliabilityScore * 0.10) + (comfortScore * 0.05) + (foodScore * 0.05);
        }
        if (isUnorthodox) finalScore -= 15;
      } else {
        // Keep daytime in the formula instead of dropping it
        // Redistribute: D=0.30, T=0.20, C=0.20, B=0.10, F=0.10, R=0.10
        finalScore = (durationScore * 0.30) + (daytimeScore * 0.20) + (comfortScore * 0.20) +
                     (budgetScore * 0.10) + (foodScore * 0.10) + (reliabilityScore * 0.10);
        if (isPremium) finalScore += 18;
      }
    }

    // Assign match reason (simplified for ablation)
    if (durationScore > 90) matchReason = "Fastest route available";
    else if (finalScore > 85) matchReason = "Top Recommendation";

    return {
      ...t,
      aiScore: Math.max(0, Math.round(finalScore)),
      matchReason,
      isUnorthodox
    };
  });

  processed.sort((a, b) => b.aiScore - a.aiScore);
  return processed;
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════
console.log('═══════════════════════════════════════════════════');
console.log('  RailCompass Ablation Analysis');
console.log('═══════════════════════════════════════════════════\n');

initData();

if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

const ABLATIONS = [
  { id: 'A0', label: 'Full RailCompass (baseline)', removed: 'None' },
  { id: 'A1', label: 'No branch adaptation', removed: 'Short/long branching + premium bonus' },
  { id: 'A2', label: 'No premium bonus', removed: '+18 premium bonus on long-haul' },
  { id: 'A3', label: 'No unorthodox penalty', removed: '−15 early-arrival penalty' },
  { id: 'A4', label: 'No overnight redistribution', removed: 'Food→comfort reweight for overnight' },
  { id: 'A5', label: 'No daytime drop (long)', removed: 'Daytime weight zeroed on long journeys' }
];

const ablationOutput = {
  generated_at: new Date().toISOString(),
  ablations: ABLATIONS,
  routes: []
};

// For each route, run all ablation variants and compare to A0
for (const route of ROUTES) {
  console.log(`\n── ${route.id}: ${route.origin} → ${route.dest} ──`);

  const rawTrains = retrieveTrains(route.origin, route.dest, route.class);
  if (rawTrains.length === 0) {
    console.log('   ⚠ No trains found.');
    continue;
  }

  const routeResult = {
    id: route.id,
    tag: route.tag,
    origin: route.origin,
    destination: route.dest,
    trainCount: rawTrains.length,
    ablations: {}
  };

  // Run baseline (A0) first
  const baselineTrains = JSON.parse(JSON.stringify(rawTrains));
  const baselineRanked = rankWithAblation(baselineTrains, route.class, 'A0');
  const baselineTop = baselineRanked.slice(0, TOP_K).map(t => t.trainNumber);
  const baselineOrder = baselineRanked.map(t => t.trainNumber);

  routeResult.ablations['A0'] = {
    top3: baselineRanked.slice(0, TOP_K).map(t => ({
      rank: 1, trainNumber: t.trainNumber, trainName: t.trainName, aiScore: t.aiScore
    })),
    top1: baselineRanked[0]?.trainName || 'N/A',
    top1Score: baselineRanked[0]?.aiScore || 0
  };

  console.log(`   A0 (baseline): Top-1 = ${baselineRanked[0]?.trainName} (${baselineRanked[0]?.aiScore})`);

  // Run each ablation variant
  for (let i = 1; i < ABLATIONS.length; i++) {
    const abl = ABLATIONS[i];
    const ablTrains = JSON.parse(JSON.stringify(rawTrains));
    const ablRanked = rankWithAblation(ablTrains, route.class, abl.id);
    const ablTop = ablRanked.slice(0, TOP_K).map(t => t.trainNumber);
    const ablOrder = ablRanked.map(t => t.trainNumber);

    // Compare Top-K
    const baseSet = new Set(baselineTop);
    const ablSet = new Set(ablTop);
    let overlap = 0;
    for (const tn of baseSet) { if (ablSet.has(tn)) overlap++; }
    const overlapPct = TOP_K > 0 ? Math.round((overlap / TOP_K) * 1000) / 10 : 0;

    // Spearman on full ranking
    const n = baselineOrder.length;
    const rankMapBase = {};
    const rankMapAbl = {};
    baselineOrder.forEach((tn, i) => { rankMapBase[tn] = i + 1; });
    ablOrder.forEach((tn, i) => { rankMapAbl[tn] = i + 1; });
    let sumD2 = 0;
    for (const tn of baselineOrder) {
      const d = (rankMapBase[tn] || 0) - (rankMapAbl[tn] || 0);
      sumD2 += d * d;
    }
    const rho = n >= 2 ? Math.round((1 - (6 * sumD2) / (n * (n * n - 1))) * 10000) / 10000 : NaN;

    // Count trains whose rank changed
    let rankChanges = 0;
    for (const tn of baselineOrder) {
      if ((rankMapBase[tn] || 0) !== (rankMapAbl[tn] || 0)) rankChanges++;
    }

    // Top-1 changed?
    const top1Changed = baselineTop[0] !== ablTop[0];

    routeResult.ablations[abl.id] = {
      top3: ablRanked.slice(0, TOP_K).map(t => ({
        trainNumber: t.trainNumber, trainName: t.trainName, aiScore: t.aiScore
      })),
      top1: ablRanked[0]?.trainName || 'N/A',
      top1Score: ablRanked[0]?.aiScore || 0,
      top3Overlap: overlapPct,
      spearmanRho: rho,
      rankChanges,
      top1Changed
    };

    const marker = top1Changed ? ' ⇆' : '';
    console.log(`   ${abl.id} (${abl.label.padEnd(30)}): Top-1 = ${ablRanked[0]?.trainName?.substring(0, 30)} (${ablRanked[0]?.aiScore})  ρ=${rho}  overlap=${overlapPct}%${marker}`);
  }

  ablationOutput.routes.push(routeResult);
}

// ── Summary table ────────────────────────────────────────────────
let table = '';
table += '═══════════════════════════════════════════════════════════════════════════\n';
table += '  ABLATION STUDY: Effect of Removing Individual Algorithm Components\n';
table += '═══════════════════════════════════════════════════════════════════════════\n\n';

// Table: Average effect of each ablation across all routes
table += 'TABLE A1: Average Impact per Ablation (across all routes with trains)\n';
table += '─────────────────────────────────────────────────────────────────────────\n';
table += `${'Ablation'.padEnd(35)} | ${'Avg ρ'.padEnd(8)} | ${'Avg Overlap'.padEnd(12)} | ${'Top-1 Δ'.padEnd(8)} | ${'Rank Δ'.padEnd(8)}\n`;
table += `${'─'.repeat(35)}-+-${'─'.repeat(8)}-+-${'─'.repeat(12)}-+-${'─'.repeat(8)}-+-${'─'.repeat(8)}\n`;

for (let i = 1; i < ABLATIONS.length; i++) {
  const abl = ABLATIONS[i];
  let sumRho = 0, sumOverlap = 0, countTop1Changed = 0, sumRankChanges = 0, count = 0;

  for (const route of ablationOutput.routes) {
    const data = route.ablations[abl.id];
    if (!data) continue;
    count++;
    if (!isNaN(data.spearmanRho)) sumRho += data.spearmanRho;
    sumOverlap += data.top3Overlap;
    if (data.top1Changed) countTop1Changed++;
    sumRankChanges += data.rankChanges;
  }

  const avgRho = count > 0 ? (sumRho / count).toFixed(4) : 'N/A';
  const avgOverlap = count > 0 ? (sumOverlap / count).toFixed(1) + '%' : 'N/A';
  const top1Changes = `${countTop1Changed}/${count}`;
  const avgRankΔ = count > 0 ? (sumRankChanges / count).toFixed(1) : 'N/A';

  table += `${abl.label.padEnd(35)} | ${avgRho.padEnd(8)} | ${avgOverlap.padEnd(12)} | ${top1Changes.padEnd(8)} | ${avgRankΔ.padEnd(8)}\n`;
}

// Table: Per-route detail
table += '\n\nTABLE A2: Per-Route Ablation Detail\n';
table += '─────────────────────────────────────────────────────────────────────────\n';

for (const route of ablationOutput.routes) {
  table += `\n${route.id}: ${route.origin} → ${route.destination} (${route.tag}, ${route.trainCount} trains)\n`;
  table += `${'  Variant'.padEnd(38)} | ${'Top-1 Train'.padEnd(35)} | ${'Score'.padEnd(6)} | ${'ρ'.padEnd(8)} | ${'Overlap'.padEnd(8)}\n`;
  table += `  ${'─'.repeat(36)}-+-${'─'.repeat(35)}-+-${'─'.repeat(6)}-+-${'─'.repeat(8)}-+-${'─'.repeat(8)}\n`;

  for (const abl of ABLATIONS) {
    const data = route.ablations[abl.id];
    if (!data) continue;
    const rho = abl.id === 'A0' ? '—' : (!isNaN(data.spearmanRho) ? data.spearmanRho.toFixed(4) : 'N/A');
    const overlap = abl.id === 'A0' ? '—' : (data.top3Overlap?.toFixed(1) + '%');
    table += `  ${abl.label.padEnd(36)} | ${(data.top1 || 'N/A').substring(0, 35).padEnd(35)} | ${String(data.top1Score).padEnd(6)} | ${rho.padEnd(8)} | ${overlap.padEnd(8)}\n`;
  }
}

// Save
fs.writeFileSync(path.join(resultsDir, 'ablation_raw.json'), JSON.stringify(ablationOutput, null, 2));
fs.writeFileSync(path.join(resultsDir, 'ablation_tables.txt'), table);

console.log('\n' + table);
console.log('\n═══════════════════════════════════════════════════');
console.log('  ✅ Ablation results saved to:');
console.log('     ablation_raw.json');
console.log('     ablation_tables.txt');
console.log('═══════════════════════════════════════════════════\n');
