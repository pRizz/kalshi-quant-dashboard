import { jsonResponse } from "~/server/http/json-response";
import { exportTradesAsCsv, listTrades } from "~/server/trades/trades-service";

export const GET = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const rows = listTrades({
    maybeSearch: url.searchParams.get("search") ?? undefined,
  });
  const csv = exportTradesAsCsv(rows);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv",
      "content-disposition": "attachment; filename=trades.csv",
    },
  });
};

export const POST = async ({ request }: { request: Request }) => {
  const payload = (await request.json()) as {
    rows: Array<Record<string, unknown>>;
  };
  const csv = exportTradesAsCsv(payload.rows);
  return jsonResponse({
    csv,
  });
};
