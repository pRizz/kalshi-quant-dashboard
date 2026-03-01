import { KalshiClientError } from "@kalshi-quant-dashboard/kalshi-client";
import type { TradingGuardState } from "./types";

export const assertTradingEnabledForPrivateRequest = (state: TradingGuardState): void => {
  if (state.mode.kind !== "trading_enabled") {
    throw new KalshiClientError({
      code: "auth_error",
      message:
        "Trading features are locked. Use Start Trading onboarding before private requests can run.",
    });
  }

  if (state.secretReadPolicy.kind !== "enabled") {
    throw new KalshiClientError({
      code: "auth_error",
      message:
        "Local secret reading is disabled. Enable local secret access to place or manage orders.",
    });
  }
};
