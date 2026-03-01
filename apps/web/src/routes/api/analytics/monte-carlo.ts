import { createMonteCarloRun } from "~/server/analytics/analytics-service";
import { jsonResponse } from "~/server/http/json-response";

export const POST = async ({ request }: { request: Request }) => {
  const payload = (await request.json()) as {
    title: string;
    assumedProbability: number;
    yesPriceCents: number;
    payoutIfYesCents: number;
    trials: number;
    seed: number;
    confidenceLevel: 0.9 | 0.95 | 0.99;
    maybeTicker?: string;
  };
  const result = createMonteCarloRun(payload);

  return jsonResponse({
    ok: true,
    ...result,
  });
};
