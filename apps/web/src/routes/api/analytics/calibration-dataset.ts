import { buildCalibrationDatasetFromMirror } from "~/server/analytics/analytics-service";
import { jsonResponse } from "~/server/http/json-response";

export const GET = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const dataset = buildCalibrationDatasetFromMirror({
    maybeLimit: Number(url.searchParams.get("limit") ?? "500"),
    maybeTicker: url.searchParams.get("ticker") ?? undefined,
  });
  return jsonResponse(dataset);
};
