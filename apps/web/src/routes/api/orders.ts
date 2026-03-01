import { mapErrorToUserMessage } from "@kalshi-quant-dashboard/kalshi-client";
import { jsonResponse } from "~/server/http/json-response";
import { listTrades } from "~/server/trades/trades-service";
import { placeOrder } from "~/server/trading/order-service";

export const GET = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const rows = listTrades({
    maybeSearch: url.searchParams.get("search") ?? undefined,
    maybeStatus:
      (url.searchParams.get("status") as "resting" | "canceled" | "executed" | null) ?? undefined,
    maybeTicker: url.searchParams.get("ticker") ?? undefined,
  });
  return jsonResponse({
    orders: rows,
  });
};

export const POST = async ({ request }: { request: Request }) => {
  try {
    const payload = (await request.json()) as {
      ticker: string;
      side: "yes" | "no";
      action: "buy" | "sell";
      count: number;
      maybeYesPrice?: number;
      maybeNoPrice?: number;
      maybeTimeInForce?: "fill_or_kill" | "good_till_canceled" | "immediate_or_cancel";
    };
    const order = await placeOrder(payload);
    return jsonResponse({
      ok: true,
      order,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        message: mapErrorToUserMessage(error),
      },
      {
        status: 400,
      },
    );
  }
};
