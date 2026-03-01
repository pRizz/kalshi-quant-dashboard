import { expect, test } from "@playwright/test";
import { enableMockTrading } from "./helpers";

test("onboarding blocks private sync until confirmed then allows it", async ({ request }) => {
  // Arrange
  const blockedResponse = await request.post("/api/sync/private");

  // Act
  const blockedPayload = (await blockedResponse.json()) as {
    ok: boolean;
    message: string;
  };
  await enableMockTrading(request);
  const enabledResponse = await request.post("/api/sync/private");
  const enabledPayload = (await enabledResponse.json()) as {
    ok: boolean;
  };

  // Assert
  expect(blockedPayload.ok).toBe(false);
  expect(blockedPayload.message.toLowerCase().length).toBeGreaterThan(5);
  expect(enabledPayload.ok).toBe(true);
});
