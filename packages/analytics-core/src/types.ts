export type MonteCarloBinaryInput = {
  ticker?: string;
  assumedProbability: number;
  yesPriceCents: number;
  payoutIfYesCents: number;
  trials: number;
  seed: number;
  confidenceLevel: 0.9 | 0.95 | 0.99;
};

export type MonteCarloSummary = {
  expectedValueCents: number;
  meanPnlCents: number;
  winRate: number;
  standardError: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  quantiles: {
    p05: number;
    p50: number;
    p95: number;
  };
};

export type MonteCarloBinaryOutput = {
  input: MonteCarloBinaryInput;
  summary: MonteCarloSummary;
  pnlSamples: number[];
};

export type BrierInput = {
  predictions: number[];
  outcomes: number[];
};

export type BrierSummary = {
  score: number;
  sampleSize: number;
};

export type CalibrationBucket = {
  bucketLower: number;
  bucketUpper: number;
  meanPrediction: number;
  observedFrequency: number;
  count: number;
};

export type CalibrationSummary = {
  brier: BrierSummary;
  buckets: CalibrationBucket[];
};

export type AnalyticsModuleType = "monte_carlo_binary" | "calibration_brier";
