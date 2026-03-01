import { mapErrorToUserMessage } from "@kalshi-quant-dashboard/kalshi-client";
import { jsonResponse } from "~/server/http/json-response";
import { cancelOrder } from "~/server/trading/order-service";

export const POST = async ({
  params,
}: {
  params: { orderId: string };
}) => {
  try {
    const result = await cancelOrder(params.orderId);
    return jsonResponse({
      ok: true,
      ...result,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        message: mapErrorToUserMessage(error),
      },
      { status: 400 },
    );
  }
};
