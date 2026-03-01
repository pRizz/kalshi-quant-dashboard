import { describe, expect, it } from "vitest";
import { calculateBrierScore } from "./brier-score";

describe("calculateBrierScore", () => {
  it("computes expected score for known fixture values", () => {
    // Arrange
    const predictions = [0.7, 0.3, 0.9, 0.1];
    const outcomes = [1, 0, 1, 0];

    // Act
    const result = calculateBrierScore({ predictions, outcomes });

    // Assert
    expect(result.score).toBeCloseTo(0.05, 8);
    expect(result.sampleSize).toBe(4);
  });

  it("throws when prediction values are outside probability range", () => {
    // Arrange
    const predictions = [1.2];
    const outcomes = [1];

    // Act
    const thrower = () => calculateBrierScore({ predictions, outcomes });

    // Assert
    expect(thrower).toThrowError("Predictions must be between 0 and 1.");
  });
});
