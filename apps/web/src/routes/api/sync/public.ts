import { jsonResponse } from "~/server/http/json-response";
import { syncPublicMarketData } from "~/server/sync/sync-service";

export const POST = async ({ request }: { request: Request }) => {
  const payload = (await request.json()) as {
    environment?: "production" | "demo";
  };
  const result = await syncPublicMarketData(payload.environment ?? "production");
  return jsonResponse({
    ok: true,
    ...result,
  });
};
