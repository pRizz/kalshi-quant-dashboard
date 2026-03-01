import { jsonResponse } from "~/server/http/json-response";
import { setTradingMode } from "~/server/settings/settings-service";

export const POST = async ({ request }: { request: Request }) => {
  const payload = (await request.json()) as {
    environment: "production" | "demo";
    mode: "read_only" | "onboarding_in_progress" | "trading_enabled";
    maybeOnboardingStep?: string;
  };

  setTradingMode({
    kind: payload.mode,
    environment: payload.environment,
    maybeOnboardingStep: payload.maybeOnboardingStep,
  });

  return jsonResponse({
    ok: true,
  });
};
