import type {
  KalshiEnvironment,
  LocalSecretReadPolicy,
  TradingMode,
} from "@kalshi-quant-dashboard/shared-types";
import { eq } from "drizzle-orm";
import { db, ensureDefaultSettings, nowIso } from "../db/client";
import { appSettings, credentialRefs } from "../db/schema";

export const getTradingMode = (): TradingMode => {
  ensureDefaultSettings();
  const maybeRow = db.select().from(appSettings).where(eq(appSettings.id, 1)).get();
  const row = maybeRow ?? {
    defaultEnvironment: "production" as const,
    tradingMode: "read_only" as const,
    onboardingStep: "disclaimer",
    allowLocalSecretRead: false,
  };

  if (row.tradingMode === "trading_enabled") {
    return {
      kind: "trading_enabled",
      environment: row.defaultEnvironment,
      validatedAtIso: row.updatedAt ?? nowIso(),
    };
  }

  if (row.tradingMode === "onboarding_in_progress") {
    return {
      kind: "onboarding_in_progress",
      environment: row.defaultEnvironment,
      step:
        (row.onboardingStep as "disclaimer" | "secret_policy" | "credentials" | "validation") ??
        "disclaimer",
    };
  }

  return {
    kind: "read_only",
    environment: row.defaultEnvironment,
  };
};

export const getSecretReadPolicy = (environment: KalshiEnvironment): LocalSecretReadPolicy => {
  ensureDefaultSettings();
  const maybeSetting = db.select().from(appSettings).where(eq(appSettings.id, 1)).get();
  if (!maybeSetting?.allowLocalSecretRead) {
    return { kind: "disabled" };
  }

  const maybeCredentialRef = db
    .select()
    .from(credentialRefs)
    .where(eq(credentialRefs.environment, environment))
    .get();
  if (!maybeCredentialRef) {
    return { kind: "disabled" };
  }

  return {
    kind: "enabled",
    apiKeyId: maybeCredentialRef.apiKeyId,
    privateKeyPath: maybeCredentialRef.privateKeyPath,
  };
};

export const setTradingMode = (mode: {
  kind: "read_only" | "onboarding_in_progress" | "trading_enabled";
  environment: KalshiEnvironment;
  maybeOnboardingStep?: string;
}): void => {
  ensureDefaultSettings();
  db.update(appSettings)
    .set({
      defaultEnvironment: mode.environment,
      tradingMode: mode.kind,
      onboardingStep: mode.maybeOnboardingStep ?? null,
      updatedAt: nowIso(),
    })
    .where(eq(appSettings.id, 1))
    .run();
};

export const setSecretReadAllowed = (isAllowed: boolean): void => {
  ensureDefaultSettings();
  db.update(appSettings)
    .set({
      allowLocalSecretRead: isAllowed,
      updatedAt: nowIso(),
    })
    .where(eq(appSettings.id, 1))
    .run();
};
