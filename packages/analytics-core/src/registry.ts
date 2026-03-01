import { buildCalibrationSummary } from "./calibration/aggregation";
import { runBinaryPayoffMonteCarlo } from "./monte-carlo/binary-payoff";
import type { AnalyticsModuleType, BrierInput, MonteCarloBinaryInput } from "./types";

export type AnalyticsModuleDefinition =
  | {
      type: "monte_carlo_binary";
      run: (input: MonteCarloBinaryInput) => unknown;
      futureWorkNote?: string;
    }
  | {
      type: "calibration_brier";
      run: (input: BrierInput) => unknown;
      futureWorkNote?: string;
    };

// Future Work (v1 deferred): importance sampling, SMC particle filters, copulas, ABM, Kelly,
// VaR/CVaR, drawdowns, stress testing. Source:
// https://gist.githubusercontent.com/pRizz/ff0c6ee6bc12865af6b4e6c8bcb1504b/raw/57bb8c18e532e516656e5a7ad7765c412eda2138/gistfile1.txt
export const analyticsRegistry: Record<AnalyticsModuleType, AnalyticsModuleDefinition> = {
  monte_carlo_binary: {
    type: "monte_carlo_binary",
    run: runBinaryPayoffMonteCarlo,
  },
  calibration_brier: {
    type: "calibration_brier",
    run: (input) => buildCalibrationSummary(input.predictions, input.outcomes),
  },
};
