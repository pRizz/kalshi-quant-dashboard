import {
  KalshiPrivateClient,
  loadPrivateKeyPem,
  mapErrorToUserMessage,
} from "@kalshi-quant-dashboard/kalshi-client";
import type { KalshiEnvironment } from "@kalshi-quant-dashboard/shared-types";
import { isMockCredential } from "./mock-trading";

export type CredentialValidationResult =
  | {
      ok: true;
      maybeBalanceCents: number;
    }
  | {
      ok: false;
      message: string;
    };

export const validateKalshiCredentials = async (input: {
  environment: KalshiEnvironment;
  apiKeyId: string;
  privateKeyPath: string;
}): Promise<CredentialValidationResult> => {
  if (isMockCredential(input)) {
    return {
      ok: true,
      maybeBalanceCents: 100_000,
    };
  }

  try {
    const privateKeyPem = await loadPrivateKeyPem(input.privateKeyPath);
    const client = new KalshiPrivateClient({
      environment: input.environment,
      apiKeyId: input.apiKeyId,
      privateKeyPem,
    });
    const balance = await client.getBalance();
    return {
      ok: true,
      maybeBalanceCents: balance.balance,
    };
  } catch (error) {
    return {
      ok: false,
      message: mapErrorToUserMessage(error),
    };
  }
};
