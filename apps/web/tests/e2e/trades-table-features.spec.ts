import { expect, test } from "@playwright/test";
import { enableMockTrading, openPage, placeMockOrderViaApi } from "./helpers";

test("trades table supports columns, saved views, search, csv export, and bulk tags", async ({
  page,
  request,
}) => {
  // Arrange
  await enableMockTrading(request);
  const orderId = await placeMockOrderViaApi(request, "MOCK-TICKER-3");
  const secondOrderId = await placeMockOrderViaApi(request, "MOCK-TICKER-4");
  const tagResponse = await request.post("/api/annotations", {
    data: {
      kind: "create_tag",
      label: "swing",
    },
  });
  const tagPayload = (await tagResponse.json()) as { tagId: string };
  await openPage(page, "/trades");

  // Act
  await page.getByPlaceholder("Search order id, ticker, side, action...").fill(orderId);
  await expect(page.getByText(orderId)).toBeVisible();
  await page.getByLabel("ticker").uncheck();
  await page.getByPlaceholder("New saved view name").fill("No ticker");
  await page.getByRole("button", { name: "Save current view" }).click();
  await expect(page.getByRole("button", { name: "No ticker" })).toBeVisible();
  await page.getByPlaceholder("Search order id, ticker, side, action...").fill("");
  await page.getByPlaceholder("Tag ID").fill(tagPayload.tagId);
  const row = page.locator("tr", { hasText: secondOrderId });
  await row.locator("input[type='checkbox']").first().check();
  await page.getByRole("button", { name: "Bulk tag selected" }).click();
  const csvResponse = await request.get("/api/trades/export");
  const csvBody = await csvResponse.text();
  const orderTagsResponse = await request.get(`/api/trades/tags?orderId=${secondOrderId}`);
  const orderTagsPayload = (await orderTagsResponse.json()) as { tags: Array<{ id: string }> };

  // Assert
  expect(csvBody).toContain(orderId);
  expect(orderTagsPayload.tags.some((tag) => tag.id === tagPayload.tagId)).toBe(true);
});
