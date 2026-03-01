import { expect, test } from "@playwright/test";
import { enableMockTrading, openPage, placeMockOrderViaApi } from "./helpers";

test("placing then canceling order updates DB-backed UI", async ({ page, request }) => {
  // Arrange
  await enableMockTrading(request);
  const orderId = await placeMockOrderViaApi(request, "MOCK-TICKER-1");

  // Act
  await openPage(page, "/trades");
  await expect(page.locator("tr", { hasText: orderId }).first()).toBeVisible();
  await request.post(`/api/orders/${orderId}/cancel`);
  await page.reload();

  // Assert
  const row = page.locator("tr", { hasText: orderId });
  await expect(row).toContainText("canceled");
});
