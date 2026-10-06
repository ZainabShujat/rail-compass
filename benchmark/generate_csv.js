// benchmark/generate_csv.js
// ═══════════════════════════════════════════════════════════════════
// CSV/TABLE GENERATOR
//
// Reads all JSON results and produces research-ready CSV files:
//   1. rankings.csv      — Full rankings for all routes × models
//   2. metrics.csv        — All four metrics in tabular form
//   3. ablation.csv       — Ablation comparison summary
//   4. train_details.csv  — Raw train attributes for all routes
//
// Usage:
//   node benchmark/generate_csv.js
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resultsDir = path.join(__dirname, 'results');

// ── 1. Rankings CSV ──────────────────────────────────────────────
const rawPath = path.join(resultsDir, 'benchmark_raw.json');
if (!fs.existsSync(rawPath)) {
  console.error('❌ benchmark_raw.json not found. Run run_benchmark.js first.');
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

let rankingsCsv = 'Route_ID,Route_Tag,Origin,Destination,Model,Rank,Train_Number,Train_Name,Type,Departure,Arrival,Duration_Min,Daytime_Hrs,Price,Score,Match_Reason,Is_Unorthodox\n';

for (const route of raw.routes) {
  if (route.trainCount === 0) continue;
  for (const [modelId, modelData] of Object.entries(route.models)) {
    for (const train of modelData.ranking) {
      rankingsCsv += [
        route.id,
        `"${route.tag}"`,
        route.origin,
        route.destination,
        modelId,
        train.rank,
        train.trainNumber,
        `"${(train.trainName || '').replace(/"/g, '""')}"`,
        train.type,
        train.departureTime,
        train.arrivalTime,
        train.durMins,
        train.daytime?.toFixed(2) || '',
        train.price,
        train.aiScore,
        `"${(train.matchReason || '').replace(/"/g, '""')}"`,
        train.isUnorthodox ? 1 : 0
      ].join(',') + '\n';
    }
  }
}

fs.writeFileSync(path.join(resultsDir, 'rankings.csv'), rankingsCsv);
console.log('✅ rankings.csv');

// ── 2. Metrics CSV ───────────────────────────────────────────────
const metricsPath = path.join(resultsDir, 'metrics_report.json');
if (fs.existsSync(metricsPath)) {
  const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));

  // Top-3 overlap
  let overlapCsv = 'Route,Duration_Overlap_Pct,Cheapest_Overlap_Pct,Fixed_Overlap_Pct\n';
  for (const row of metrics.metric1_top3_overlap) {
    overlapCsv += [
      `"${row.route}"`,
      row.duration_only?.percentage?.toFixed(1) || '',
      row.cheapest_only?.percentage?.toFixed(1) || '',
      row.fixed_utility?.percentage?.toFixed(1) || ''
    ].join(',') + '\n';
  }
  fs.writeFileSync(path.join(resultsDir, 'metric_top3_overlap.csv'), overlapCsv);
  console.log('✅ metric_top3_overlap.csv');

  // Spearman
  let spearCsv = 'Route,Duration_Rho,Cheapest_Rho,Fixed_Rho\n';
  for (const row of metrics.metric2_spearman) {
    spearCsv += [
      `"${row.route}"`,
      !isNaN(row.duration_only?.rho) ? row.duration_only.rho.toFixed(4) : '',
      !isNaN(row.cheapest_only?.rho) ? row.cheapest_only.rho.toFixed(4) : '',
      !isNaN(row.fixed_utility?.rho) ? row.fixed_utility.rho.toFixed(4) : ''
    ].join(',') + '\n';
  }
  fs.writeFileSync(path.join(resultsDir, 'metric_spearman.csv'), spearCsv);
  console.log('✅ metric_spearman.csv');

  // Early arrival
  let earlyCsv = 'Route,Duration_Count,Cheapest_Count,Fixed_Count,RailCompass_Count\n';
  for (const row of metrics.metric3_early_arrival) {
    earlyCsv += [
      `"${row.route}"`,
      row.duration_only ?? '',
      row.cheapest_only ?? '',
      row.fixed_utility ?? '',
      row.railcompass ?? ''
    ].join(',') + '\n';
  }
  fs.writeFileSync(path.join(resultsDir, 'metric_early_arrival.csv'), earlyCsv);
  console.log('✅ metric_early_arrival.csv');

  // Adaptive effect
  let adaptCsv = 'Route,Fixed_Top3,RailCompass_Top3,Top3_Changed\n';
  for (const row of metrics.metric4_adaptive_effect) {
    adaptCsv += [
      `"${row.route}"`,
      `"${row.fixedTop3?.join('; ') || ''}"`,
      `"${row.railcompassTop3?.join('; ') || ''}"`,
      row.top3Changed ? 1 : 0
    ].join(',') + '\n';
  }
  fs.writeFileSync(path.join(resultsDir, 'metric_adaptive_effect.csv'), adaptCsv);
  console.log('✅ metric_adaptive_effect.csv');
}

// ── 3. Ablation CSV ──────────────────────────────────────────────
const ablationPath = path.join(resultsDir, 'ablation_raw.json');
if (fs.existsSync(ablationPath)) {
  const ablation = JSON.parse(fs.readFileSync(ablationPath, 'utf8'));

  let ablCsv = 'Route_ID,Origin,Destination,Ablation_ID,Ablation_Label,Top1_Train,Top1_Score,Spearman_Rho,Top3_Overlap_Pct,Top1_Changed,Rank_Changes\n';

  for (const route of ablation.routes) {
    for (const [ablId, data] of Object.entries(route.ablations)) {
      const label = ablation.ablations.find(a => a.id === ablId)?.label || ablId;
      ablCsv += [
        route.id,
        route.origin,
        route.destination,
        ablId,
        `"${label}"`,
        `"${(data.top1 || '').replace(/"/g, '""')}"`,
        data.top1Score,
        data.spearmanRho !== undefined ? data.spearmanRho : '',
        data.top3Overlap !== undefined ? data.top3Overlap : '',
        data.top1Changed !== undefined ? (data.top1Changed ? 1 : 0) : '',
        data.rankChanges !== undefined ? data.rankChanges : ''
      ].join(',') + '\n';
    }
  }
  fs.writeFileSync(path.join(resultsDir, 'ablation.csv'), ablCsv);
  console.log('✅ ablation.csv');
}

// ── 4. Train details CSV (one row per route per train, RailCompass model only) ──
let detailsCsv = 'Route_ID,Origin,Destination,Train_Number,Train_Name,Type,Departure,Arrival,Duration_Min,Duration_Fmt,Daytime_Hrs,Price,Reliability,Comfort,Food,Score,Rank,Match_Reason,Is_Unorthodox,Is_Premium\n';

for (const route of raw.routes) {
  if (route.trainCount === 0) continue;
  const rcModel = route.models.railcompass;
  if (!rcModel) continue;
  for (const t of rcModel.ranking) {
    const isPremium = ['Rajdhani', 'Shatabdi', 'Tejas', 'Vande Bharat'].includes(t.type) ? 1 : 0;
    detailsCsv += [
      route.id,
      route.origin,
      route.destination,
      t.trainNumber,
      `"${(t.trainName || '').replace(/"/g, '""')}"`,
      t.type,
      t.departureTime,
      t.arrivalTime,
      t.durMins,
      `"${t.duration}"`,
      t.daytime?.toFixed(2) || '',
      t.price,
      t.metrics?.reliabilityRating || '',
      t.metrics?.comfortRating || '',
      t.metrics?.foodRating || '',
      t.aiScore,
      t.rank,
      `"${(t.matchReason || '').replace(/"/g, '""')}"`,
      t.isUnorthodox ? 1 : 0,
      isPremium
    ].join(',') + '\n';
  }
}

fs.writeFileSync(path.join(resultsDir, 'train_details.csv'), detailsCsv);
console.log('✅ train_details.csv');

console.log(`\n✅ All CSVs saved to: ${resultsDir}`);
