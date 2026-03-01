import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { writeActivity } from "../audit/activity-log-service";
import { db, nowIso } from "../db/client";
import { credentialRefs } from "../db/schema";
import { setSecretReadAllowed, setTradingMode } from "../settings/settings-service";
import { validateKalshiCredentials } from "./credentials-validator";
import type { StartTradingOnboardingInput } from "./types";

export const beginOnboarding = (environment: "production" | "demo"): void => {
  setTradingMode({
    kind: "onboarding_in_progress",
    environment,
    maybeOnboardingStep: "disclaimer",
  });
  writeActivity({
    actionType: "onboarding.begin",
    summary: `Started trading onboarding for ${environment}`,
  });
};

export const completeOnboarding = async (
  input: StartTradingOnboardingInput,
): Promise<{ ok: true } | { ok: false; message: string }> => {
  if (!input.allowLocalSecretRead) {
    return {
      ok: false,
      message: "You must enable local secret reading before trading can be enabled.",
    };
  }

  setTradingMode({
    kind: "onboarding_in_progress",
    environment: input.environment,
    maybeOnboardingStep: "validation",
  });
  setSecretReadAllowed(true);

  const validation = await validateKalshiCredentials({
    environment: input.environment,
    apiKeyId: input.apiKeyId,
    privateKeyPath: input.privateKeyPath,
  });
  if (!validation.ok) {
    setTradingMode({
      kind: "onboarding_in_progress",
      environment: input.environment,
      maybeOnboardingStep: "credentials",
    });
    return validation;
  }

  const maybeExistingRef = db
    .select()
    .from(credentialRefs)
    .where(eq(credentialRefs.environment, input.environment))
    .get();
  if (maybeExistingRef) {
    db.update(credentialRefs)
      .set({
        apiKeyId: input.apiKeyId,
        privateKeyPath: input.privateKeyPath,
        lastValidatedAt: nowIso(),
        validationError: null,
        updatedAt: nowIso(),
      })
      .where(eq(credentialRefs.id, maybeExistingRef.id))
      .run();
  } else {
    db.insert(credentialRefs)
      .values({
        id: nanoid(),
        environment: input.environment,
        apiKeyId: input.apiKeyId,
        privateKeyPath: input.privateKeyPath,
        lastValidatedAt: nowIso(),
        validationError: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      })
      .run();
  }

  setTradingMode({
    kind: "trading_enabled",
    environment: input.environment,
  });
  writeActivity({
    actionType: "onboarding.complete",
    summary: `Enabled trading for ${input.environment}`,
  });

  return { ok: true };
};
