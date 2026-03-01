import { describe, expect, it } from "vitest";
import { runBinaryPayoffMonteCarlo } from "./binary-payoff";

describe("runBinaryPayoffMonteCarlo", () => {
  it("returns deterministic output for the same seed", () => {
    // Arrange
    const baseInput = {
      assumedProbability: 0.62,
      yesPriceCents: 61,
      payoutIfYesCents: 100,
      trials: 10_000,
      seed: 42,
      confidenceLevel: 0.95 as const,
    };

    // Act
    const firstRun = runBinaryPayoffMonteCarlo(baseInput);
    const secondRun = runBinaryPayoffMonteCarlo(baseInput);

    // Assert
    expect(secondRun.summary.meanPnlCents).toEqual(firstRun.summary.meanPnlCents);
    expect(secondRun.summary.confidenceInterval).toEqual(firstRun.summary.confidenceInterval);
    expect(secondRun.pnlSamples).toEqual(firstRun.pnlSamples);
  });
});
