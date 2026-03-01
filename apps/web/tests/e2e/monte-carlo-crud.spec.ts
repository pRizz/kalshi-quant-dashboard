import { expect, test } from "@playwright/test";
import { openPage } from "./helpers";

test("monte carlo run persists, is viewable, deletable, and reproducible by seed", async ({
  page,
  request,
}) => {
  // Arrange
  const payload = {
    title: "Deterministic MC",
    assumedProbability: 0.62,
    yesPriceCents: 62,
    payoutIfYesCents: 100,
    trials: 10_000,
    seed: 123,
    confidenceLevel: 0.95,
  };

  // Act
  await request.post("/api/analytics/monte-carlo", { data: payload });
  await request.post("/api/analytics/monte-carlo", { data: payload });
  const runsResponse = await request.get("/api/analytics/runs");
  const runsPayload = (await runsResponse.json()) as {
    runs: Array<{ id: string; title: string; resultJson: string; moduleType: string }>;
  };
  const deterministicRuns = runsPayload.runs.filter(
    (run) => run.title === "Deterministic MC" && run.moduleType === "monte_carlo_binary",
  );
  const firstRun = deterministicRuns[0];
  const secondRun = deterministicRuns[1];
  await openPage(page, "/analytics/monte-carlo");
  await request.delete(`/api/analytics/runs?id=${firstRun?.id}`);
  const afterDelete = await request.get("/api/analytics/runs");
  const afterDeletePayload = (await afterDelete.json()) as {
    runs: Array<{ id: string }>;
  };

  // Assert
  expect(firstRun).toBeDefined();
  expect(secondRun).toBeDefined();
  expect(firstRun?.resultJson).toEqual(secondRun?.resultJson);
  await expect(page.getByText("Deterministic MC").first()).toBeVisible();
  expect(afterDeletePayload.runs.some((run) => run.id === firstRun?.id)).toBe(false);
});
