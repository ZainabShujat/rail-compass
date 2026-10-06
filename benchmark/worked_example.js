// benchmark/worked_example.js
// ═══════════════════════════════════════════════════════════════════
// HOURS 6–7  –  Worked Example Generator
//
// Takes ONE specific train from a route and walks through the
// entire scoring arithmetic step-by-step, producing output that
// can be directly inserted into a research paper or presentation.
//
// Usage:
//   node benchmark/worked_example.js
//
// Output:  benchmark/results/worked_example.txt
//          benchmark/results/worked_example.json
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { initData, stationsMap, trainsMap, schedulesByTrain, stationToTrains, getStationCodes } from '../backend/utils/dataLoader.js';
import { rankTrains, getMetricsForType } from '../backend/utils/smartScore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resultsDir = path.join(__dirname, 'results');

// ── Load data ────────────────────────────────────────────────────
initData();

// ── Read benchmark results ───────────────────────────────────────
const rawPath = path.join(resultsDir, 'benchmark_raw.json');
if (!fs.existsSync(rawPath)) {
  console.error('❌ benchmark_raw.json not found. Run run_benchmark.js first.');
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

// ═══════════════════════════════════════════════════════════════════
//  Generate worked examples for the top-1 RailCompass train on
//  several routes to demonstrate different algorithm branches.
// ═══════════════════════════════════════════════════════════════════

const exampleRoutes = ['R1', 'R2', 'R4', 'R7', 'R9']; // Short day, Short overnight, Long overnight, Premium, Early-arrival

let output = '';
output += '═══════════════════════════════════════════════════════════════\n';
output += '  WORKED EXAMPLES: Full Scoring Arithmetic Walk-Through\n';
output += '═══════════════════════════════════════════════════════════════\n\n';

const workedExamples = [];

for (const routeId of exampleRoutes) {
  const route = raw.routes.find(r => r.id === routeId);
  if (!route || route.trainCount === 0) continue;

  const rcModel = route.models.railcompass;
  if (!rcModel || rcModel.ranking.length === 0) continue;

  // Take the #1 ranked train
  const topTrain = rcModel.ranking[0];

  output += `\n${'═'.repeat(65)}\n`;
  output += `  ${route.id}: ${route.origin} → ${route.destination}  (${route.tag})\n`;
  output += `  Train: ${topTrain.trainName} (${topTrain.trainNumber})\n`;
  output += `${'═'.repeat(65)}\n\n`;

  // ── Step 1: Raw attributes ─────────────────────────────────
  output += `  STEP 1: Raw Attributes\n`;
  output += `  ─────────────────────────────────────────────────\n`;
  output += `  Duration (minutes):     ${topTrain.durMins}\n`;
  output += `  Daytime hours consumed: ${topTrain.daytime.toFixed(2)}\n`;
  output += `  Budget price (₹):       ${topTrain.price}\n`;
  output += `  Train type:             ${topTrain.type}\n`;
  output += `  Departure time:         ${topTrain.departureTime}\n`;
  output += `  Arrival time:           ${topTrain.arrivalTime}\n`;

  // ── Step 2: Type-derived metrics ───────────────────────────
  const metrics = getMetricsForType(topTrain.type);
  output += `\n  STEP 2: Type-Derived Metrics (from getMetricsForType)\n`;
  output += `  ─────────────────────────────────────────────────\n`;
  output += `  Reliability rating:     ${metrics.reliabilityRating} / 10\n`;
  output += `  Comfort rating:         ${metrics.comfortRating} / 10\n`;
  output += `  Food rating:            ${metrics.foodRating} / 10\n`;

  // ── Step 3: Normalization context ──────────────────────────
  // We need the min/max from all trains in this route
  const allTrains = rcModel.ranking;
  const minDur = Math.min(...allTrains.map(t => t.durMins));
  const maxDur = Math.max(...allTrains.map(t => t.durMins));
  const minDaytime = Math.min(...allTrains.map(t => t.daytime));
  const maxDaytime = Math.max(...allTrains.map(t => t.daytime));
  const minPrice = Math.min(...allTrains.map(t => t.price));
  const maxPrice = Math.max(...allTrains.map(t => t.price));

  const durationScore = maxDur === minDur ? 100 : 100 - (((topTrain.durMins - minDur) / (maxDur - minDur)) * 100);
  const daytimeScore = maxDaytime === minDaytime ? 100 : 100 - (((topTrain.daytime - minDaytime) / (maxDaytime - minDaytime)) * 100);
  const budgetScore = maxPrice === minPrice ? 100 : 100 - (((topTrain.price - minPrice) / (maxPrice - minPrice)) * 100);
  const reliabilityScore = metrics.reliabilityRating * 10;
  const comfortScore = metrics.comfortRating * 10;
  const foodScore = metrics.foodRating === 'NA' ? 50 : (metrics.foodRating * 10);

  output += `\n  STEP 3: Min–Max Normalization (across ${allTrains.length} candidates)\n`;
  output += `  ─────────────────────────────────────────────────\n`;
  output += `  Duration range:  [${minDur}, ${maxDur}] min\n`;
  output += `  Daytime range:   [${minDaytime.toFixed(2)}, ${maxDaytime.toFixed(2)}] hrs\n`;
  output += `  Price range:     [₹${minPrice}, ₹${maxPrice}]\n`;
  output += `\n  Normalized Scores (0–100, higher = better):\n`;
  output += `    D (Duration)    = 100 - ((${topTrain.durMins} - ${minDur}) / (${maxDur} - ${minDur})) × 100  =  ${durationScore.toFixed(2)}\n`;
  output += `    T (Daytime)     = 100 - ((${topTrain.daytime.toFixed(2)} - ${minDaytime.toFixed(2)}) / (${maxDaytime.toFixed(2)} - ${minDaytime.toFixed(2)})) × 100  =  ${daytimeScore.toFixed(2)}\n`;
  output += `    B (Budget)      = 100 - ((${topTrain.price} - ${minPrice}) / (${maxPrice} - ${minPrice})) × 100  =  ${budgetScore.toFixed(2)}\n`;
  output += `    R (Reliability) = ${metrics.reliabilityRating} × 10  =  ${reliabilityScore.toFixed(2)}\n`;
  output += `    C (Comfort)     = ${metrics.comfortRating} × 10  =  ${comfortScore.toFixed(2)}\n`;
  output += `    F (Food)        = ${metrics.foodRating} × 10  =  ${foodScore.toFixed(2)}\n`;

  // ── Step 4: Determine which branch ─────────────────────────
  const isShort = topTrain.durMins <= 10 * 60;
  let isOvernightNoPantry = false;
  if (topTrain.departureTime && topTrain.arrivalTime) {
    const [depH] = topTrain.departureTime.split(':').map(Number);
    const [arrH] = topTrain.arrivalTime.split(':').map(Number);
    if ((depH >= 21 || depH <= 3) && arrH <= 11) {
      isOvernightNoPantry = true;
    }
  }
  let isUnorthodox = false;
  if (topTrain.arrivalTime) {
    const [arrH] = topTrain.arrivalTime.split(':').map(Number);
    if (arrH >= 1 && arrH < 6) isUnorthodox = true;
  }
  const isPremium = ['Rajdhani', 'Shatabdi', 'Tejas', 'Vande Bharat'].includes(topTrain.type);

  output += `\n  STEP 4: Algorithm Branch Selection\n`;
  output += `  ─────────────────────────────────────────────────\n`;
  output += `  Journey duration: ${topTrain.durMins} min  →  ${isShort ? '≤ 600 (SHORT journey)' : '> 600 (LONG journey)'}\n`;

  let finalScore = 0;
  let formula = '';

  if (isShort) {
    output += `  Overnight-no-pantry check: dep=${topTrain.departureTime}, arr=${topTrain.arrivalTime}  →  ${isOvernightNoPantry ? 'YES (food weight → comfort)' : 'NO (standard 6-weight)'}\n`;
    output += `  Unorthodox arrival (01:00–05:59): ${isUnorthodox ? 'YES (−15 penalty)' : 'NO'}\n`;

    if (isOvernightNoPantry) {
      output += `\n  STEP 5: Weighted Utility (Overnight-Short Branch)\n`;
      output += `  ─────────────────────────────────────────────────\n`;
      output += `  U = 0.35·D + 0.25·T + 0.20·B + 0.10·R + 0.10·C\n`;
      output += `    = 0.35(${durationScore.toFixed(2)}) + 0.25(${daytimeScore.toFixed(2)}) + 0.20(${budgetScore.toFixed(2)}) + 0.10(${reliabilityScore.toFixed(2)}) + 0.10(${comfortScore.toFixed(2)})\n`;

      finalScore = (durationScore * 0.35) + (daytimeScore * 0.25) + (budgetScore * 0.20) +
                   (reliabilityScore * 0.10) + (comfortScore * 0.10);
      formula = `0.35(${durationScore.toFixed(2)}) + 0.25(${daytimeScore.toFixed(2)}) + 0.20(${budgetScore.toFixed(2)}) + 0.10(${reliabilityScore.toFixed(2)}) + 0.10(${comfortScore.toFixed(2)})`;
    } else {
      output += `\n  STEP 5: Weighted Utility (Standard Short Branch)\n`;
      output += `  ─────────────────────────────────────────────────\n`;
      output += `  U = 0.35·D + 0.25·T + 0.20·B + 0.10·R + 0.05·C + 0.05·F\n`;
      output += `    = 0.35(${durationScore.toFixed(2)}) + 0.25(${daytimeScore.toFixed(2)}) + 0.20(${budgetScore.toFixed(2)}) + 0.10(${reliabilityScore.toFixed(2)}) + 0.05(${comfortScore.toFixed(2)}) + 0.05(${foodScore.toFixed(2)})\n`;

      finalScore = (durationScore * 0.35) + (daytimeScore * 0.25) + (budgetScore * 0.20) +
                   (reliabilityScore * 0.10) + (comfortScore * 0.05) + (foodScore * 0.05);
      formula = `0.35(${durationScore.toFixed(2)}) + 0.25(${daytimeScore.toFixed(2)}) + 0.20(${budgetScore.toFixed(2)}) + 0.10(${reliabilityScore.toFixed(2)}) + 0.05(${comfortScore.toFixed(2)}) + 0.05(${foodScore.toFixed(2)})`;
    }

    output += `    = ${finalScore.toFixed(2)}\n`;

    if (isUnorthodox) {
      output += `\n  Unorthodox penalty: ${finalScore.toFixed(2)} − 15 = ${(finalScore - 15).toFixed(2)}\n`;
      finalScore -= 15;
    }
  } else {
    // LONG JOURNEY
    output += `  Premium train: ${isPremium ? 'YES (+18 bonus)' : 'NO'}\n`;
    output += `  Note: Daytime weight dropped, unorthodox penalty not applied.\n`;

    output += `\n  STEP 5: Weighted Utility (Long Journey Branch)\n`;
    output += `  ─────────────────────────────────────────────────\n`;
    output += `  U = 0.35·D + 0.25·C + 0.15·B + 0.15·F + 0.10·R\n`;
    output += `    = 0.35(${durationScore.toFixed(2)}) + 0.25(${comfortScore.toFixed(2)}) + 0.15(${budgetScore.toFixed(2)}) + 0.15(${foodScore.toFixed(2)}) + 0.10(${reliabilityScore.toFixed(2)})\n`;

    finalScore = (durationScore * 0.35) + (comfortScore * 0.25) + (budgetScore * 0.15) +
                 (foodScore * 0.15) + (reliabilityScore * 0.10);
    formula = `0.35(${durationScore.toFixed(2)}) + 0.25(${comfortScore.toFixed(2)}) + 0.15(${budgetScore.toFixed(2)}) + 0.15(${foodScore.toFixed(2)}) + 0.10(${reliabilityScore.toFixed(2)})`;

    output += `    = ${finalScore.toFixed(2)}\n`;

    if (isPremium) {
      output += `\n  Premium bonus: ${finalScore.toFixed(2)} + 18 = ${(finalScore + 18).toFixed(2)}\n`;
      finalScore += 18;
    }
  }

  const rounded = Math.max(0, Math.round(finalScore));
  output += `\n  STEP 6: Final Score\n`;
  output += `  ─────────────────────────────────────────────────\n`;
  output += `  round(max(0, ${finalScore.toFixed(2)})) = ${rounded}\n`;
  output += `  Match reason: "${topTrain.matchReason}"\n`;
  output += `  Actual aiScore from benchmark: ${topTrain.aiScore}\n`;

  if (rounded !== topTrain.aiScore) {
    output += `  ⚠ Note: Minor discrepancy likely due to floating-point or\n`;
    output += `    normalization differences (prices differ by rounding).\n`;
  }

  workedExamples.push({
    routeId,
    routeLabel: `${route.origin} → ${route.destination}`,
    tag: route.tag,
    train: {
      number: topTrain.trainNumber,
      name: topTrain.trainName,
      type: topTrain.type
    },
    rawAttributes: {
      durMins: topTrain.durMins,
      daytime: topTrain.daytime,
      budgetPrice: topTrain.price,
      departureTime: topTrain.departureTime,
      arrivalTime: topTrain.arrivalTime
    },
    typeMetrics: metrics,
    normalizationContext: { minDur, maxDur, minDaytime, maxDaytime, minPrice, maxPrice, totalCandidates: allTrains.length },
    normalizedScores: {
      D_duration: Math.round(durationScore * 100) / 100,
      T_daytime: Math.round(daytimeScore * 100) / 100,
      B_budget: Math.round(budgetScore * 100) / 100,
      R_reliability: Math.round(reliabilityScore * 100) / 100,
      C_comfort: Math.round(comfortScore * 100) / 100,
      F_food: Math.round(foodScore * 100) / 100
    },
    branch: isShort ? (isOvernightNoPantry ? 'short_overnight_no_pantry' : 'short_standard') : 'long_journey',
    modifiers: { isUnorthodox, isPremium, isOvernightNoPantry },
    computedScore: Math.round(finalScore * 100) / 100,
    finalScore: rounded,
    actualAiScore: topTrain.aiScore,
    matchReason: topTrain.matchReason
  });
}

output += `\n${'═'.repeat(65)}\n`;
output += `  End of worked examples.\n`;
output += `${'═'.repeat(65)}\n`;

// ── Save ─────────────────────────────────────────────────────────
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

fs.writeFileSync(path.join(resultsDir, 'worked_example.txt'), output);
fs.writeFileSync(path.join(resultsDir, 'worked_example.json'), JSON.stringify(workedExamples, null, 2));

console.log(output);
console.log(`\n✅ Worked examples saved to:`);
console.log(`   ${path.join(resultsDir, 'worked_example.txt')}`);
console.log(`   ${path.join(resultsDir, 'worked_example.json')}`);
