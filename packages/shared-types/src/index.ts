export type KalshiEnvironment = "production" | "demo";

export type TradingMode =
  | {
      kind: "read_only";
      environment: KalshiEnvironment;
    }
  | {
      kind: "onboarding_in_progress";
      environment: KalshiEnvironment;
      step: "disclaimer" | "secret_policy" | "credentials" | "validation";
    }
  | {
      kind: "trading_enabled";
      environment: KalshiEnvironment;
      validatedAtIso: string;
    };

export type LocalSecretReadPolicy =
  | {
      kind: "disabled";
    }
  | {
      kind: "enabled";
      apiKeyId: string;
      privateKeyPath: string;
    };

export const kalshiEnvironmentOptions: KalshiEnvironment[] = ["production", "demo"];
