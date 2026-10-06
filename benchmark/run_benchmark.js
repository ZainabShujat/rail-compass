// benchmark/run_benchmark.js
// ═══════════════════════════════════════════════════════════════════
// HOURS 2–4  –  Generate the benchmark data
//
// This script:
//   1. Loads the real RailCompass data via the existing dataLoader.
//   2. For every (route × model), calls the production train-retrieval
//      + ranking pipeline exactly as the server does.
//   3. Saves raw JSON per route, plus a combined master file.
//
// Usage:
//   node benchmark/run_benchmark.js
//
// Output files written to  benchmark/results/
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Import the ACTUAL production modules ─────────────────────────
import { initData, stationsMap, trainsMap, schedulesByTrain, stationToTrains, getStationCodes } from '../backend/utils/dataLoader.js';
import { rankTrains, getMetricsForType } from '../backend/utils/smartScore.js';

import { ROUTES, MODELS, TOP_K, TOP_N, EARLY_ARRIVAL_START, EARLY_ARRIVAL_END } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Helpers (copied verbatim from trainController.js) ────────────
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
    if (overlapStart < overlapEnd) {
      daytimeHours += (overlapEnd - overlapStart);
    }
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

// ── Core: retrieve trains exactly like trainController.getTrains ──
function retrieveTrains(originQuery, destQuery, preferredClass) {
  const originCodes = getStationCodes(originQuery);
  const destCodes = getStationCodes(destQuery);

  if (originCodes.length === 0 || destCodes.length === 0) return [];

  const candidateTrains = new Set();
  for (const oCode of originCodes) {
    const trains = stationToTrains[oCode];
    if (trains) {
      for (const t of trains) candidateTrains.add(t);
    }
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
          if (!bestPair || (d.idx - o.idx < bestPair.d.idx - bestPair.o.idx)) {
            bestPair = { o, d };
          }
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

      // IMPORTANT: use a fixed seed for availableSeats so runs are reproducible
      results.push({
        _id: tNum,
        trainNumber: tNum,
        trainName: trainDetails?.name || oStop.train_name,
        departureStation: stationsMap[bestPair.o.code.toLowerCase()]?.name || bestPair.o.code,
        arrivalStation: stationsMap[bestPair.d.code.toLowerCase()]?.name || bestPair.d.code,
        departureTime: depTime.substring(0, 5),
        arrivalTime: arrTime.substring(0, 5),
        durMins,
        daytime,
        duration: formatDuration(durMins),
        type: trainType,
        prices: getDummyPrices(durMins, trainType, trainDetails),
        availableSeats: 100, // Fixed for reproducibility (production uses Math.random)
        isDedicatedRoute: (bestPair.o.idx === 0 && bestPair.d.idx === schedule.length - 1)
      });
    }
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════
console.log('═══════════════════════════════════════════════════');
console.log('  RailCompass Benchmark – Data Generation');
console.log('═══════════════════════════════════════════════════\n');

// 1. Load data
initData();

const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

const masterOutput = {
  generated_at: new Date().toISOString(),
  routes: [],
  summary: {}
};

for (const route of ROUTES) {
  console.log(`\n── ${route.id}: ${route.origin} → ${route.dest}  (${route.tag}) ──`);

  // Retrieve raw candidates (same for all models)
  const rawTrains = retrieveTrains(route.origin, route.dest, route.class);
  console.log(`   Found ${rawTrains.length} candidate trains.`);

  if (rawTrains.length === 0) {
    console.log(`   ⚠ No trains found – skipping.`);
    masterOutput.routes.push({
      id: route.id,
      tag: route.tag,
      origin: route.origin,
      destination: route.dest,
      preferredClass: route.class,
      trainCount: 0,
      models: {}
    });
    continue;
  }

  const routeResult = {
    id: route.id,
    tag: route.tag,
    origin: route.origin,
    destination: route.dest,
    preferredClass: route.class,
    trainCount: rawTrains.length,
    models: {}
  };

  for (const model of MODELS) {
    // Deep-copy raw trains so each model gets a fresh set
    const trainsCopy = JSON.parse(JSON.stringify(rawTrains));

    // Build the query object that rankTrains expects
    const queryWeights = { ...model.weights, preferredClass: route.class };

    const ranked = rankTrains(trainsCopy, queryWeights, route.class);

    // Save compact per-train data
    const compactRanking = ranked.map((t, rank) => ({
      rank: rank + 1,
      trainNumber: t.trainNumber,
      trainName: t.trainName,
      type: t.type,
      departureStation: t.departureStation,
      arrivalStation: t.arrivalStation,
      departureTime: t.departureTime,
      arrivalTime: t.arrivalTime,
      durMins: t.durMins,
      daytime: t.daytime,
      duration: t.duration,
      price: t.budgetPrice,
      aiScore: t.aiScore,
      matchReason: t.matchReason,
      isUnorthodox: t.isUnorthodox,
      metrics: t.metrics
    }));

    routeResult.models[model.id] = {
      label: model.label,
      weights: model.weights,
      totalTrained: compactRanking.length,
      ranking: compactRanking
    };

    console.log(`   ${model.label.padEnd(30)} → Top-1: ${compactRanking[0]?.trainName || 'N/A'} (score: ${compactRanking[0]?.aiScore})`);
  }

  masterOutput.routes.push(routeResult);

  // Save individual route file
  const routeFile = path.join(resultsDir, `${route.id}_${route.origin}_${route.dest}.json`);
  fs.writeFileSync(routeFile, JSON.stringify(routeResult, null, 2));
}

// ─── Summary ─────────────────────────────────────────────────────
masterOutput.summary = {
  totalRoutes: ROUTES.length,
  routesWithTrains: masterOutput.routes.filter(r => r.trainCount > 0).length,
  routesWithNoTrains: masterOutput.routes.filter(r => r.trainCount === 0).length,
  modelsEvaluated: MODELS.map(m => m.label)
};

const masterFile = path.join(resultsDir, 'benchmark_raw.json');
fs.writeFileSync(masterFile, JSON.stringify(masterOutput, null, 2));

console.log('\n═══════════════════════════════════════════════════');
console.log(`  ✅ Raw data saved to ${resultsDir}`);
console.log(`     Master file: benchmark_raw.json`);
console.log(`     Per-route:   R1_*.json .. R10_*.json`);
console.log('═══════════════════════════════════════════════════\n');
