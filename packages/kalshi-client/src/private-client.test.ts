import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { KalshiClientError } from "./errors";
import { KalshiPrivateClient } from "./private-client";

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

describe("KalshiPrivateClient", () => {
  it("sends required auth headers for private requests", async () => {
    // Arrange
    const observedHeaders: Record<string, string> = {};
    const maybeFetchImplementation: typeof fetch = async (_input, maybeInit) => {
      const headers = maybeInit?.headers as Record<string, string>;
      Object.assign(observedHeaders, headers);
      return new Response(
        JSON.stringify({
          balance: 1000,
          portfolio_value: 1050,
          updated_ts: 1,
        }),
        { status: 200 },
      );
    };

    const client = new KalshiPrivateClient({
      environment: "demo",
      apiKeyId: "abc",
      privateKeyPem: createPrivateKeyPem(),
      maybeFetchImplementation,
    });

    // Act
    await client.getBalance();

    // Assert
    expect(observedHeaders["KALSHI-ACCESS-KEY"]).toBe("abc");
    expect(observedHeaders["KALSHI-ACCESS-SIGNATURE"]).toBeDefined();
    expect(observedHeaders["KALSHI-ACCESS-TIMESTAMP"]).toBeDefined();
  });

  it("maps 401 responses into auth errors", async () => {
    // Arrange
    const maybeFetchImplementation: typeof fetch = async () =>
      new Response(JSON.stringify({ code: "UNAUTHORIZED" }), { status: 401 });

    const client = new KalshiPrivateClient({
      environment: "demo",
      apiKeyId: "abc",
      privateKeyPem: createPrivateKeyPem(),
      maybeFetchImplementation,
    });

    // Act
    const thrower = async () => client.getBalance();

    // Assert
    await expect(thrower).rejects.toBeInstanceOf(KalshiClientError);
    await expect(thrower).rejects.toMatchObject({
      code: "auth_error",
      status: 401,
    });
  });
});
