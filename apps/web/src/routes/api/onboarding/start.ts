import { jsonResponse } from "~/server/http/json-response";
import { beginOnboarding } from "~/server/trading/onboarding-service";

export const POST = async ({ request }: { request: Request }) => {
  const payload = (await request.json()) as {
    environment?: "production" | "demo";
  };

  const environment = payload.environment ?? "production";
  beginOnboarding(environment);
  return jsonResponse({
    ok: true,
  });
};
