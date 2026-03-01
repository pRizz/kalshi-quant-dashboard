import type {
  KalshiEnvironment,
  LocalSecretReadPolicy,
  TradingMode,
} from "@kalshi-quant-dashboard/shared-types";

export type StartTradingOnboardingInput = {
  environment: KalshiEnvironment;
  apiKeyId: string;
  privateKeyPath: string;
  allowLocalSecretRead: boolean;
};

export type TradingGuardState = {
  mode: TradingMode;
  secretReadPolicy: LocalSecretReadPolicy;
};
