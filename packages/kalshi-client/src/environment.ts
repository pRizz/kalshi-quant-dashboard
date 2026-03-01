import type { KalshiEnvironment } from "@kalshi-quant-dashboard/shared-types";

export const kalshiBaseUrlByEnvironment: Record<KalshiEnvironment, string> = {
  production: "https://api.elections.kalshi.com/trade-api/v2",
  demo: "https://demo-api.kalshi.co/trade-api/v2",
};

export const resolveKalshiBaseUrl = (environment: KalshiEnvironment): string =>
  kalshiBaseUrlByEnvironment[environment];
