import type { APIRequestContext, Page } from "@playwright/test";

export const enableMockTrading = async (request: APIRequestContext) => {
  await request.post("/api/onboarding/complete", {
    data: {
      environment: "demo",
      apiKeyId: "mock_key",
      privateKeyPath: "mock://demo",
      allowLocalSecretRead: true,
    },
  });
};

export const placeMockOrderViaApi = async (request: APIRequestContext, ticker: string) => {
  const response = await request.post("/api/orders", {
    data: {
      ticker,
      side: "yes",
      action: "buy",
      count: 3,
      maybeYesPrice: 55,
      maybeNoPrice: 45,
    },
  });
  const payload = (await response.json()) as {
    order?: { order_id: string };
    ok: boolean;
  };
  return payload.order?.order_id ?? "";
};

export const openPage = async (page: Page, path: string) => {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
};
