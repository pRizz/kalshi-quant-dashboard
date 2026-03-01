import { expect, test } from "@playwright/test";
import { openPage } from "./helpers";

test("read-only launch works without secrets", async ({ page, request }) => {
  // Arrange
  await request.post("/api/settings/mode", {
    data: {
      environment: "production",
      mode: "read_only",
    },
  });
  await openPage(page, "/");

  // Act
  const modeText = page.getByText("Current mode:");

  // Assert
  await expect(modeText).toContainText("read_only");
  await expect(page.getByRole("button", { name: "Start Trading" })).toBeVisible();
});
