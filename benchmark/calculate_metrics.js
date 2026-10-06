// benchmark/calculate_metrics.js
// ═══════════════════════════════════════════════════════════════════
// HOURS 4–6  –  Calculate the actual metrics
//
// Reads benchmark/results/benchmark_raw.json and computes:
//   Metric 1: Top-3 Overlap
//   Metric 2: Spearman Rank Correlation
//   Metric 3: Early-Arrival Avoidance (1 AM–5 AM in Top-5)
//   Metric 4: Adaptive Effect (Top-3 changed vs Fixed Utility)
//
// Usage:
//   node benchmark/calculate_metrics.js
//
// Output:  benchmark/results/metrics_report.json
//          benchmark/results/metrics_tables.txt   (copy-paste-ready)
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOP_K, TOP_N, EARLY_ARRIVAL_START, EARLY_ARRIVAL_END } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resultsDir = path.join(__dirname, 'results');

// ── Load raw benchmark data ──────────────────────────────────────
const rawPath = path.join(resultsDir, 'benchmark_raw.json');
if (!fs.existsSync(rawPath)) {
  console.error('❌ benchmark_raw.json not found. Run run_benchmark.js first.');
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

// ═══════════════════════════════════════════════════════════════════
//  HELPER: Spearman Rank Correlation
// ═══════════════════════════════════════════════════════════════════
function spearmanCorrelation(ranking1, ranking2) {
  // ranking1 and ranking2 are arrays of trainNumbers in ranked order.
  // We compute over the intersection of trains present in both.
  
  // Build rank maps: trainNumber → 1-based rank
  const rankMap1 = {};
  const rankMap2 = {};
  ranking1.forEach((tn, i) => { rankMap1[tn] = i + 1; });
  ranking2.forEach((tn, i) => { rankMap2[tn] = i + 1; });

  // Use the union of train numbers that appear in both rankings
  const commonTrains = ranking1.filter(tn => rankMap2[tn] !== undefined);
  const n = commonTrains.length;
  if (n < 2) return { rho: NaN, n: 0 };

  let sumD2 = 0;
  for (const tn of commonTrains) {
    const d = rankMap1[tn] - rankMap2[tn];
    sumD2 += d * d;
  }

  const rho = 1 - (6 * sumD2) / (n * (n * n - 1));
  return { rho: Math.round(rho * 10000) / 10000, n };
}

// ═══════════════════════════════════════════════════════════════════
//  HELPER: Top-K Overlap
// ═══════════════════════════════════════════════════════════════════
function topKOverlap(ranking1, ranking2, k) {
  const set1 = new Set(ranking1.slice(0, k));
  const set2 = new Set(ranking2.slice(0, k));
  let overlap = 0;
  for (const tn of set1) {
    if (set2.has(tn)) overlap++;
  }
  const maxPossible = Math.min(set1.size, set2.size, k);
  return {
    overlapCount: overlap,
    percentage: maxPossible > 0 ? Math.round((overlap / maxPossible) * 1000) / 10 : 0
  };
}

// ═══════════════════════════════════════════════════════════════════
//  HELPER: Count early-arrival trains in top-N
// ═══════════════════════════════════════════════════════════════════
function countEarlyArrivals(ranking, topN) {
  let count = 0;
  const subset = ranking.slice(0, topN);
  for (const train of subset) {
    if (train.arrivalTime) {
      const [arrH] = train.arrivalTime.split(':').map(Number);
      if (arrH >= EARLY_ARRIVAL_START && arrH < EARLY_ARRIVAL_END) {
        count++;
      }
    }
  }
  return count;
}

// ═══════════════════════════════════════════════════════════════════
//  COMPUTE METRICS
// ═══════════════════════════════════════════════════════════════════
console.log('═══════════════════════════════════════════════════');
console.log('  RailCompass Benchmark – Metric Calculation');
console.log('═══════════════════════════════════════════════════\n');

const metricsReport = {
  generated_at: new Date().toISOString(),
  parameters: { TOP_K, TOP_N, EARLY_ARRIVAL_START, EARLY_ARRIVAL_END },
  metric1_top3_overlap: [],
  metric2_spearman: [],
  metric3_early_arrival: [],
  metric4_adaptive_effect: []
};

// Comparison models for Top-3 overlap and Spearman (compared against RailCompass)
const comparisonModels = ['duration_only', 'cheapest_only', 'fixed_utility'];
const comparisonLabels = { duration_only: 'Duration', cheapest_only: 'Cheapest', fixed_utility: 'Fixed' };

// ── Metric 1: Top-3 Overlap ─────────────────────────────────────
console.log('── Metric 1: Top-3 Overlap (vs RailCompass) ──\n');
const overlapHeader = `${'Route'.padEnd(25)} ${'Duration'.padEnd(12)} ${'Cheapest'.padEnd(12)} ${'Fixed'.padEnd(12)}`;
console.log(overlapHeader);
console.log('─'.repeat(overlapHeader.length));

for (const route of raw.routes) {
  if (route.trainCount === 0) continue;
  const rcRanking = route.models.railcompass?.ranking?.map(t => t.trainNumber) || [];

  const row = { route: `${route.id}: ${route.origin}→${route.destination}` };

  for (const mId of comparisonModels) {
    const otherRanking = route.models[mId]?.ranking?.map(t => t.trainNumber) || [];
    const result = topKOverlap(rcRanking, otherRanking, TOP_K);
    row[mId] = result;
  }

  metricsReport.metric1_top3_overlap.push(row);

  const dPct = row.duration_only?.percentage?.toFixed(1) || 'N/A';
  const cPct = row.cheapest_only?.percentage?.toFixed(1) || 'N/A';
  const fPct = row.fixed_utility?.percentage?.toFixed(1) || 'N/A';
  console.log(`${row.route.padEnd(25)} ${(dPct + '%').padEnd(12)} ${(cPct + '%').padEnd(12)} ${(fPct + '%').padEnd(12)}`);
}

// ── Metric 2: Spearman Correlation ──────────────────────────────
console.log('\n── Metric 2: Spearman Rank Correlation (ρ vs RailCompass) ──\n');
const spearHeader = `${'Route'.padEnd(25)} ${'Duration'.padEnd(12)} ${'Cheapest'.padEnd(12)} ${'Fixed'.padEnd(12)}`;
console.log(spearHeader);
console.log('─'.repeat(spearHeader.length));

for (const route of raw.routes) {
  if (route.trainCount === 0) continue;
  const rcRanking = route.models.railcompass?.ranking?.map(t => t.trainNumber) || [];

  const row = { route: `${route.id}: ${route.origin}→${route.destination}` };

  for (const mId of comparisonModels) {
    const otherRanking = route.models[mId]?.ranking?.map(t => t.trainNumber) || [];
    const result = spearmanCorrelation(rcRanking, otherRanking);
    row[mId] = result;
  }

  metricsReport.metric2_spearman.push(row);

  const dRho = row.duration_only?.rho !== undefined ? row.duration_only.rho.toFixed(4) : 'N/A';
  const cRho = row.cheapest_only?.rho !== undefined ? row.cheapest_only.rho.toFixed(4) : 'N/A';
  const fRho = row.fixed_utility?.rho !== undefined ? row.fixed_utility.rho.toFixed(4) : 'N/A';
  console.log(`${row.route.padEnd(25)} ${dRho.padEnd(12)} ${cRho.padEnd(12)} ${fRho.padEnd(12)}`);
}

// ── Metric 3: Early-Arrival Avoidance ───────────────────────────
console.log(`\n── Metric 3: Early-Arrival (${EARLY_ARRIVAL_START}:00–${EARLY_ARRIVAL_END}:00) Trains in Top-${TOP_N} ──\n`);
const earlyHeader = `${'Route'.padEnd(25)} ${'Duration'.padEnd(12)} ${'Cheapest'.padEnd(12)} ${'Fixed'.padEnd(12)} ${'RailCompass'.padEnd(12)}`;
console.log(earlyHeader);
console.log('─'.repeat(earlyHeader.length));

for (const route of raw.routes) {
  if (route.trainCount === 0) continue;
  const row = { route: `${route.id}: ${route.origin}→${route.destination}` };

  const allModels = [...comparisonModels, 'railcompass'];
  for (const mId of allModels) {
    const ranking = route.models[mId]?.ranking || [];
    row[mId] = countEarlyArrivals(ranking, TOP_N);
  }

  metricsReport.metric3_early_arrival.push(row);

  const d = String(row.duration_only ?? 'N/A');
  const c = String(row.cheapest_only ?? 'N/A');
  const f = String(row.fixed_utility ?? 'N/A');
  const r = String(row.railcompass ?? 'N/A');
  console.log(`${row.route.padEnd(25)} ${d.padEnd(12)} ${c.padEnd(12)} ${f.padEnd(12)} ${r.padEnd(12)}`);
}

// ── Metric 4: Adaptive Effect ───────────────────────────────────
console.log(`\n── Metric 4: Adaptive Effect (Top-${TOP_K} changed: Fixed Utility → RailCompass) ──\n`);

let totalRoutes = 0;
let routesWithChange = 0;

for (const route of raw.routes) {
  if (route.trainCount === 0) continue;
  totalRoutes++;

  const rcTop = route.models.railcompass?.ranking?.slice(0, TOP_K).map(t => t.trainNumber) || [];
  const fixedTop = route.models.fixed_utility?.ranking?.slice(0, TOP_K).map(t => t.trainNumber) || [];

  const rcSet = new Set(rcTop);
  const fixedSet = new Set(fixedTop);

  let identical = true;
  if (rcSet.size !== fixedSet.size) {
    identical = false;
  } else {
    for (const tn of rcSet) {
      if (!fixedSet.has(tn)) { identical = false; break; }
    }
  }

  const changed = !identical;
  if (changed) routesWithChange++;

  metricsReport.metric4_adaptive_effect.push({
    route: `${route.id}: ${route.origin}→${route.destination}`,
    fixedTop3: fixedTop,
    railcompassTop3: rcTop,
    top3Changed: changed
  });

  console.log(`  ${route.id}: ${route.origin}→${route.destination}  →  Top-${TOP_K} ${changed ? '⇆ CHANGED' : '= SAME'}`);
}

const adaptivePct = totalRoutes > 0 ? Math.round((routesWithChange / totalRoutes) * 100) : 0;
console.log(`\n  Summary: ${routesWithChange}/${totalRoutes} routes (${adaptivePct}%) had their Top-${TOP_K} altered by the adaptive mechanism.\n`);

metricsReport.metric4_summary = {
  totalRoutes,
  routesWithChange,
  percentage: adaptivePct
};

// ── Save reports ─────────────────────────────────────────────────
const metricsFile = path.join(resultsDir, 'metrics_report.json');
fs.writeFileSync(metricsFile, JSON.stringify(metricsReport, null, 2));

// ── Generate copy-paste-ready LaTeX-style tables ─────────────────
let tables = '';
tables += '═══════════════════════════════════════════════════════════════\n';
tables += 'TABLE 1: Top-3 Overlap (%) — Each Model vs RailCompass\n';
tables += '═══════════════════════════════════════════════════════════════\n';
tables += `${'Route'.padEnd(25)} | ${'Duration'.padEnd(10)} | ${'Cheapest'.padEnd(10)} | ${'Fixed'.padEnd(10)}\n`;
tables += `${'─'.repeat(25)}-+-${'─'.repeat(10)}-+-${'─'.repeat(10)}-+-${'─'.repeat(10)}\n`;
for (const row of metricsReport.metric1_top3_overlap) {
  const d = row.duration_only?.percentage?.toFixed(1) || 'N/A';
  const c = row.cheapest_only?.percentage?.toFixed(1) || 'N/A';
  const f = row.fixed_utility?.percentage?.toFixed(1) || 'N/A';
  tables += `${row.route.padEnd(25)} | ${(d + '%').padEnd(10)} | ${(c + '%').padEnd(10)} | ${(f + '%').padEnd(10)}\n`;
}

tables += '\n\n═══════════════════════════════════════════════════════════════\n';
tables += 'TABLE 2: Spearman Rank Correlation (ρ) — Each Model vs RailCompass\n';
tables += '═══════════════════════════════════════════════════════════════\n';
tables += `${'Route'.padEnd(25)} | ${'Duration'.padEnd(10)} | ${'Cheapest'.padEnd(10)} | ${'Fixed'.padEnd(10)}\n`;
tables += `${'─'.repeat(25)}-+-${'─'.repeat(10)}-+-${'─'.repeat(10)}-+-${'─'.repeat(10)}\n`;
for (const row of metricsReport.metric2_spearman) {
  const d = !isNaN(row.duration_only?.rho) ? row.duration_only.rho.toFixed(4) : 'N/A';
  const c = !isNaN(row.cheapest_only?.rho) ? row.cheapest_only.rho.toFixed(4) : 'N/A';
  const f = !isNaN(row.fixed_utility?.rho) ? row.fixed_utility.rho.toFixed(4) : 'N/A';
  tables += `${row.route.padEnd(25)} | ${d.padEnd(10)} | ${c.padEnd(10)} | ${f.padEnd(10)}\n`;
}

tables += '\n\n═══════════════════════════════════════════════════════════════\n';
tables += `TABLE 3: Early-Arrival Trains (${EARLY_ARRIVAL_START}:00–${EARLY_ARRIVAL_END}:00) in Top-${TOP_N}\n`;
tables += '═══════════════════════════════════════════════════════════════\n';
tables += `${'Route'.padEnd(25)} | ${'Duration'.padEnd(10)} | ${'Cheapest'.padEnd(10)} | ${'Fixed'.padEnd(10)} | ${'RC'.padEnd(10)}\n`;
tables += `${'─'.repeat(25)}-+-${'─'.repeat(10)}-+-${'─'.repeat(10)}-+-${'─'.repeat(10)}-+-${'─'.repeat(10)}\n`;
for (const row of metricsReport.metric3_early_arrival) {
  tables += `${row.route.padEnd(25)} | ${String(row.duration_only ?? 'N/A').padEnd(10)} | ${String(row.cheapest_only ?? 'N/A').padEnd(10)} | ${String(row.fixed_utility ?? 'N/A').padEnd(10)} | ${String(row.railcompass ?? 'N/A').padEnd(10)}\n`;
}

tables += '\n\n═══════════════════════════════════════════════════════════════\n';
tables += `TABLE 4: Adaptive Effect — Top-${TOP_K} Changed?\n`;
tables += '═══════════════════════════════════════════════════════════════\n';
for (const row of metricsReport.metric4_adaptive_effect) {
  tables += `${row.route.padEnd(30)} → ${row.top3Changed ? 'CHANGED' : 'SAME'}\n`;
}
tables += `\nOverall: ${routesWithChange}/${totalRoutes} routes (${adaptivePct}%) had Top-${TOP_K} altered.\n`;

const tablesFile = path.join(resultsDir, 'metrics_tables.txt');
fs.writeFileSync(tablesFile, tables);

console.log('═══════════════════════════════════════════════════');
console.log(`  ✅ Metrics saved to:`);
console.log(`     JSON:   metrics_report.json`);
console.log(`     Tables: metrics_tables.txt`);
console.log('═══════════════════════════════════════════════════\n');
