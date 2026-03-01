import { mapErrorToUserMessage } from "@kalshi-quant-dashboard/kalshi-client";
import { jsonResponse } from "~/server/http/json-response";
import { getTradingMode } from "~/server/settings/settings-service";
import { syncPrivatePortfolioData } from "~/server/sync/sync-service";

export const POST = async () => {
  try {
    const mode = getTradingMode();
    const result = await syncPrivatePortfolioData(mode.environment);
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
      {
        status: 400,
      },
    );
  }
};
