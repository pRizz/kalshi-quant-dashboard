import { jsonResponse } from "~/server/http/json-response";
import { completeOnboarding } from "~/server/trading/onboarding-service";

export const POST = async ({ request }: { request: Request }) => {
  const payload = (await request.json()) as {
    environment: "production" | "demo";
    apiKeyId: string;
    privateKeyPath: string;
    allowLocalSecretRead: boolean;
  };

  const result = await completeOnboarding(payload);
  if (!result.ok) {
    return jsonResponse(result, {
      status: 400,
    });
  }

  return jsonResponse(result);
};
