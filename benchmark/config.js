// benchmark/config.js
// ─── Benchmark Configuration ──────────────────────────────────────
// 10 carefully chosen routes that exercise distinct mechanisms.
// Each route has:
//   id       – Case label (R1–R10)
//   tag      – What the route tests
//   origin   – City or station name (as the user would type it)
//   dest     – Destination city or station name
//   class    – Preferred travel class for price extraction

export const ROUTES = [
  { id: 'R1',  tag: 'Short daytime',              origin: 'Delhi',     dest: 'Jaipur',      class: '3AC' },
  { id: 'R2',  tag: 'Short overnight',             origin: 'Delhi',     dest: 'Lucknow',     class: '3AC' },
  { id: 'R3',  tag: 'Long daytime',                origin: 'Chennai',   dest: 'Bangalore',   class: 'CC'  },
  { id: 'R4',  tag: 'Long overnight',              origin: 'Delhi',     dest: 'Mumbai',      class: '3AC' },
  { id: 'R5',  tag: 'Multi-terminal origin',       origin: 'Mumbai',    dest: 'Pune',        class: '3AC' },
  { id: 'R6',  tag: 'Multi-terminal destination',  origin: 'Lucknow',   dest: 'Delhi',       class: '3AC' },
  { id: 'R7',  tag: 'Premium vs non-premium',      origin: 'Delhi',     dest: 'Kolkata',     class: '3AC' },
  { id: 'R8',  tag: 'Cheap vs fast trade-off',     origin: 'Ahmedabad', dest: 'Mumbai',      class: 'SL'  },
  { id: 'R9',  tag: 'Early-morning arrival',        origin: 'Hyderabad', dest: 'Chennai',     class: '3AC' },
  { id: 'R10', tag: 'Several similar-duration',     origin: 'Bangalore', dest: 'Hyderabad',   class: '3AC' }
];

// ─── Ranking Models ─────────────────────────────────────────────────
// Each model supplies a set of weights to the rankTrains() function.
// "railcompass" uses the standard defaults (all undefined → triggers
// the adaptive path in smartScore.js).

export const MODELS = [
  {
    id: 'duration_only',
    label: 'Duration-Only',
    // All weight on duration → non-standard path
    weights: {
      weightDuration: '1.0',
      weightDaytime:  '0.0',
      weightBudget:   '0.0',
      weightReliability: '0.0',
      weightComfort:  '0.0',
      weightFood:     '0.0'
    }
  },
  {
    id: 'cheapest_only',
    label: 'Cheapest-Only',
    weights: {
      weightDuration: '0.0',
      weightDaytime:  '0.0',
      weightBudget:   '1.0',
      weightReliability: '0.0',
      weightComfort:  '0.0',
      weightFood:     '0.0'
    }
  },
  {
    id: 'equal_weight',
    label: 'Equal-Weight Baseline',
    // Uniform weights across all six attributes (1/6 ≈ 0.167 each)
    weights: {
      weightDuration: '0.167',
      weightDaytime:  '0.167',
      weightBudget:   '0.167',
      weightReliability: '0.167',
      weightComfort:  '0.166',
      weightFood:     '0.166'
    }
  },
  {
    id: 'railcompass',
    label: 'RailCompass (Adaptive)',
    // Leave weights undefined → triggers the standard adaptive path
    weights: {}
  }
];

// ─── Metric Parameters ─────────────────────────────────────────────
export const TOP_K = 3;               // For top-K overlap metric
export const TOP_N = 5;               // For early-arrival count metric
export const EARLY_ARRIVAL_START = 1;  // 01:00
export const EARLY_ARRIVAL_END   = 5;  // 05:00 (exclusive of 06:00 as per code line 100)
