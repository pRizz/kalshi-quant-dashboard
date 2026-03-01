import { expect, test } from "@playwright/test";
import { enableMockTrading, placeMockOrderViaApi } from "./helpers";

test("portfolio sync preserves local annotations", async ({ request }) => {
  // Arrange
  await enableMockTrading(request);
  const orderId = await placeMockOrderViaApi(request, "MOCK-TICKER-2");
  await request.post("/api/annotations", {
    data: {
      kind: "create_annotation",
      targetType: "order",
      targetId: orderId,
      title: "Preserve me",
      contentMarkdown: "Local-only annotation",
    },
  });

  // Act
  await request.post("/api/sync/private");
  const response = await request.get("/api/annotations?search=Preserve");
  const payload = (await response.json()) as {
    annotations: Array<{ title: string }>;
  };

  // Assert
  expect(payload.annotations.some((annotation) => annotation.title === "Preserve me")).toBe(true);
});
