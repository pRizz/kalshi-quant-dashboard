import { createCalibrationRun } from "~/server/analytics/analytics-service";
import { jsonResponse } from "~/server/http/json-response";

export const POST = async ({ request }: { request: Request }) => {
  const payload = (await request.json()) as {
    title: string;
    predictions: number[];
    outcomes: number[];
    maybeBucketCount?: number;
  };

  const result = createCalibrationRun(payload);
  return jsonResponse({
    ok: true,
    ...result,
  });
};
