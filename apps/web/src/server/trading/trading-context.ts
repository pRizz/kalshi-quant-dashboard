import { getSecretReadPolicy, getTradingMode } from "../settings/settings-service";
import type { TradingGuardState } from "./types";

export const getTradingGuardState = (): TradingGuardState => {
  const mode = getTradingMode();
  const secretReadPolicy = getSecretReadPolicy(mode.environment);
  return { mode, secretReadPolicy };
};
