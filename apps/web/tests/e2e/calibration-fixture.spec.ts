import { expect, test } from "@playwright/test";
import { openPage } from "./helpers";

test("calibration dashboard computes expected Brier score on fixture dataset", async ({
  page,
  request,
}) => {
  // Arrange
  const fixture = {
    title: "Fixture calibration",
    predictions: [0.7, 0.3, 0.9, 0.1],
    outcomes: [1, 0, 1, 0],
    maybeBucketCount: 5,
  };

  // Act
  const response = await request.post("/api/analytics/calibration", {
    data: fixture,
  });
  const payload = (await response.json()) as {
    result: {
      brier: {
        score: number;
      };
    };
  };
  await openPage(page, "/analytics/calibration");

  // Assert
  expect(payload.result.brier.score).toBeCloseTo(0.05, 8);
  await expect(page.locator("body")).toContainText("Calibration");
});
