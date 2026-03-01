import type { BrierInput, BrierSummary } from "../types";

const assertAlignedLengths = (predictions: number[], outcomes: number[]): void => {
  if (predictions.length !== outcomes.length) {
    throw new Error("Predictions and outcomes length mismatch.");
  }

  if (predictions.length === 0) {
    throw new Error("Predictions cannot be empty.");
  }
};

const assertPredictionRange = (prediction: number): void => {
  if (prediction < 0 || prediction > 1) {
    throw new Error("Predictions must be between 0 and 1.");
  }
};

const assertOutcomeRange = (outcome: number): void => {
  if (outcome !== 0 && outcome !== 1) {
    throw new Error("Outcomes must be 0 or 1.");
  }
};

export const calculateBrierScore = ({ predictions, outcomes }: BrierInput): BrierSummary => {
  assertAlignedLengths(predictions, outcomes);

  const squaredErrorSum = predictions.reduce((accumulator, prediction, index) => {
    const outcome = outcomes[index];
    assertPredictionRange(prediction);
    assertOutcomeRange(outcome ?? Number.NaN);
    const error = prediction - (outcome ?? 0);
    return accumulator + error * error;
  }, 0);

  return {
    score: squaredErrorSum / predictions.length,
    sampleSize: predictions.length,
  };
};
