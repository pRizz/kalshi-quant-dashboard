import { jsonResponse } from "~/server/http/json-response";
import { listEvents, listMarkets } from "~/server/markets/market-service";

export const GET = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const maybeSearch = url.searchParams.get("search") ?? undefined;
  const maybeStatus = url.searchParams.get("status") ?? undefined;
  const markets = listMarkets({
    maybeSearch,
    maybeStatus,
  });
  const events = listEvents();

  return jsonResponse({
    markets,
    events,
  });
};
