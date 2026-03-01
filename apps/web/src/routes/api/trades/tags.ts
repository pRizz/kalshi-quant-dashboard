import { jsonResponse } from "~/server/http/json-response";
import { listOrderTags } from "~/server/trades/trades-service";

export const GET = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  if (!orderId) {
    return jsonResponse({
      tags: [],
    });
  }

  return jsonResponse({
    tags: listOrderTags(orderId),
  });
};
