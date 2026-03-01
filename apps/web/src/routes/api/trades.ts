import { jsonResponse } from "~/server/http/json-response";
import {
  bulkAssignTagToOrders,
  listOrderTags,
  listTrades,
  listTradesViews,
  saveTradesView,
} from "~/server/trades/trades-service";

export const GET = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const rows = listTrades({
    maybeSearch: url.searchParams.get("search") ?? undefined,
    maybeStatus:
      (url.searchParams.get("status") as "resting" | "canceled" | "executed" | null) ?? undefined,
    maybeTicker: url.searchParams.get("ticker") ?? undefined,
  });
  const rowsWithTags = rows.map((row) => ({
    ...row,
    tags: listOrderTags(row.orderId),
  }));
  return jsonResponse({
    trades: rowsWithTags,
    savedViews: listTradesViews(),
  });
};

export const POST = async ({ request }: { request: Request }) => {
  const payload = (await request.json()) as
    | {
        kind: "save_view";
        viewName: string;
        stateJson: string;
        isDefault: boolean;
      }
    | {
        kind: "bulk_tag";
        orderIds: string[];
        tagId: string;
      };

  if (payload.kind === "save_view") {
    saveTradesView(payload);
    return jsonResponse({ ok: true });
  }

  bulkAssignTagToOrders(payload.orderIds, payload.tagId);
  return jsonResponse({ ok: true });
};
