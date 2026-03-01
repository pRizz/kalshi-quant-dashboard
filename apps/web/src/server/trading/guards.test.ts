import { describe, expect, it } from "vitest";
import { assertTradingEnabledForPrivateRequest } from "./guards";

describe("assertTradingEnabledForPrivateRequest", () => {
  it("throws when mode is read-only", () => {
    // Arrange
    const input = {
      mode: {
        kind: "read_only" as const,
        environment: "production" as const,
      },
      secretReadPolicy: {
        kind: "disabled" as const,
      },
    };

    // Act
    const thrower = () => assertTradingEnabledForPrivateRequest(input);

    // Assert
    expect(thrower).toThrow();
  });
});
