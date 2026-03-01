import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildSigningMessage, createKalshiAuthHeaders, stripQueryFromPath } from "./signing";

const createPrivateKeyPem = (): string => {
  const keyPair = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  return keyPair.privateKey
    .export({
      type: "pkcs8",
      format: "pem",
    })
    .toString();
};

describe("Kalshi request signing", () => {
  it("excludes query parameters from signing message path", () => {
    // Arrange
    const timestampMs = "1703123456789";
    const method = "GET";
    const path = "/trade-api/v2/portfolio/orders?limit=5&cursor=abc";

    // Act
    const message = buildSigningMessage(timestampMs, method, path);

    // Assert
    expect(stripQueryFromPath(path)).toBe("/trade-api/v2/portfolio/orders");
    expect(message).toBe("1703123456789GET/trade-api/v2/portfolio/orders");
  });

  it("creates required Kalshi auth headers", () => {
    // Arrange
    const privateKeyPem = createPrivateKeyPem();

    // Act
    const headers = createKalshiAuthHeaders({
      apiKeyId: "test-key-id",
      privateKeyPem,
      method: "GET",
      pathWithMaybeQuery: "/trade-api/v2/portfolio/balance",
      maybeTimestampMs: "1703123456789",
    });

    // Assert
    expect(headers["KALSHI-ACCESS-KEY"]).toBe("test-key-id");
    expect(headers["KALSHI-ACCESS-TIMESTAMP"]).toBe("1703123456789");
    expect(headers["KALSHI-ACCESS-SIGNATURE"].length).toBeGreaterThan(10);
  });
});
