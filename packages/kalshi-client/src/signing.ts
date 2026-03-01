import { constants, createPrivateKey, sign } from "node:crypto";
import { readFile } from "node:fs/promises";

export const stripQueryFromPath = (path: string): string => path.split("?")[0] ?? path;

export const buildSigningMessage = (
  timestampMs: string,
  method: string,
  pathWithMaybeQuery: string,
): string => `${timestampMs}${method.toUpperCase()}${stripQueryFromPath(pathWithMaybeQuery)}`;

export const loadPrivateKeyPem = async (privateKeyPath: string): Promise<string> => {
  const keyData = await readFile(privateKeyPath, "utf-8");
  return keyData;
};

export const signKalshiRequest = (options: {
  privateKeyPem: string;
  timestampMs: string;
  method: string;
  pathWithMaybeQuery: string;
}): string => {
  const keyObject = createPrivateKey({
    key: options.privateKeyPem,
  });
  const message = buildSigningMessage(
    options.timestampMs,
    options.method,
    options.pathWithMaybeQuery,
  );
  const signature = sign("sha256", Buffer.from(message, "utf-8"), {
    key: keyObject,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
  });

  return signature.toString("base64");
};

export const createKalshiAuthHeaders = (options: {
  apiKeyId: string;
  privateKeyPem: string;
  method: string;
  pathWithMaybeQuery: string;
  maybeTimestampMs?: string;
}): Record<string, string> => {
  const timestampMs = options.maybeTimestampMs ?? `${Date.now()}`;
  const signature = signKalshiRequest({
    privateKeyPem: options.privateKeyPem,
    timestampMs,
    method: options.method,
    pathWithMaybeQuery: options.pathWithMaybeQuery,
  });

  return {
    "KALSHI-ACCESS-KEY": options.apiKeyId,
    "KALSHI-ACCESS-TIMESTAMP": timestampMs,
    "KALSHI-ACCESS-SIGNATURE": signature,
  };
};
