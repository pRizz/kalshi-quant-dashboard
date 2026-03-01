import type { MonteCarloBinaryInput, MonteCarloBinaryOutput } from "../types";
import { confidenceInterval } from "./confidence-interval";
import { SeededRng } from "./rng";

const quantile = (values: number[], quantileLevel: number): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor(quantileLevel * (sorted.length - 1))),
  );
  return sorted[index] ?? 0;
};

const clampProbability = (value: number): number => Math.min(1, Math.max(0, value));

const resolvePnl = (didWin: boolean, yesPriceCents: number, payoutIfYesCents: number): number => {
  if (didWin) {
    return payoutIfYesCents - yesPriceCents;
  }

  return -yesPriceCents;
};

export const runBinaryPayoffMonteCarlo = (input: MonteCarloBinaryInput): MonteCarloBinaryOutput => {
  const trials = Math.max(1, Math.floor(input.trials));
  const probability = clampProbability(input.assumedProbability);
  const rng = new SeededRng(input.seed);
  const pnlSamples: number[] = [];

  for (let trialIndex = 0; trialIndex < trials; trialIndex += 1) {
    const didWin = rng.next() <= probability;
    pnlSamples.push(resolvePnl(didWin, input.yesPriceCents, input.payoutIfYesCents));
  }

  const pnlSum = pnlSamples.reduce((accumulator, sample) => accumulator + sample, 0);
  const averagePnl = pnlSum / trials;
  const winRate = pnlSamples.filter((sample) => sample > 0).length / trials;
  const interval = confidenceInterval(pnlSamples, input.confidenceLevel);

  return {
    input: {
      ...input,
      trials,
    },
    summary: {
      expectedValueCents: averagePnl,
      meanPnlCents: averagePnl,
      winRate,
      standardError: interval.standardError,
      confidenceInterval: {
        lower: interval.lower,
        upper: interval.upper,
      },
      quantiles: {
        p05: quantile(pnlSamples, 0.05),
        p50: quantile(pnlSamples, 0.5),
        p95: quantile(pnlSamples, 0.95),
      },
    },
    pnlSamples,
  };
};
