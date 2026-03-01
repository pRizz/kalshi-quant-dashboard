import {
  deleteAnalyticsRun,
  listAnalyticsRuns,
  rerunAnalyticsWithPatch,
} from "~/server/analytics/analytics-service";
import { jsonResponse } from "~/server/http/json-response";

export const GET = async () =>
  jsonResponse({
    runs: listAnalyticsRuns(),
  });

export const DELETE = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const runId = url.searchParams.get("id");
  if (!runId) {
    return jsonResponse(
      {
        ok: false,
        message: "Missing analytics run id.",
      },
      { status: 400 },
    );
  }

  deleteAnalyticsRun(runId);
  return jsonResponse({
    ok: true,
  });
};

export const PATCH = async ({ request }: { request: Request }) => {
  const payload = (await request.json()) as {
    runId: string;
    patch: Record<string, unknown>;
  };
  const result = rerunAnalyticsWithPatch(payload.runId, payload.patch);
  return jsonResponse({
    ok: true,
    ...result,
  });
};
