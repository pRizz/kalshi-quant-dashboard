import {
  analyticsRegistry,
  buildCalibrationSummary,
  runBinaryPayoffMonteCarlo,
} from "@kalshi-quant-dashboard/analytics-core";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { writeActivity } from "../audit/activity-log-service";
import { db, nowIso } from "../db/client";
import { analyticsRuns, kalshiFills, kalshiMarketsCache } from "../db/schema";

export const listAnalyticsRuns = () =>
  db.select().from(analyticsRuns).orderBy(desc(analyticsRuns.createdAt)).all();

export const getAnalyticsRunById = (runId: string) =>
  db.select().from(analyticsRuns).where(eq(analyticsRuns.id, runId)).get();

export const deleteAnalyticsRun = (runId: string) => {
  db.delete(analyticsRuns).where(eq(analyticsRuns.id, runId)).run();
  writeActivity({
    actionType: "analytics.delete",
    summary: `Deleted analytics run ${runId}`,
    maybeMetadata: {
      runId,
    },
  });
};

export const createMonteCarloRun = (input: {
  title: string;
  assumedProbability: number;
  yesPriceCents: number;
  payoutIfYesCents: number;
  trials: number;
  seed: number;
  confidenceLevel: 0.9 | 0.95 | 0.99;
  maybeTicker?: string;
}) => {
  const module = analyticsRegistry.monte_carlo_binary;
  const result = module.run({
    ticker: input.maybeTicker,
    assumedProbability: input.assumedProbability,
    yesPriceCents: input.yesPriceCents,
    payoutIfYesCents: input.payoutIfYesCents,
    trials: input.trials,
    seed: input.seed,
    confidenceLevel: input.confidenceLevel,
  });
  const runId = nanoid();
  db.insert(analyticsRuns)
    .values({
      id: runId,
      moduleType: "monte_carlo_binary",
      title: input.title,
      seed: `${input.seed}`,
      inputJson: JSON.stringify(input),
      resultJson: JSON.stringify(result),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .run();

  writeActivity({
    actionType: "analytics.run.monte_carlo",
    summary: `Ran Monte Carlo simulation ${input.title}`,
    maybeMetadata: {
      runId,
      trials: input.trials,
    },
  });

  return { runId, result };
};

export const createCalibrationRun = (input: {
  title: string;
  predictions: number[];
  outcomes: number[];
  maybeBucketCount?: number;
}) => {
  const module = analyticsRegistry.calibration_brier;
  const result = module.run({
    predictions: input.predictions,
    outcomes: input.outcomes,
  });
  const fullResult = buildCalibrationSummary(
    input.predictions,
    input.outcomes,
    input.maybeBucketCount,
  );

  const runId = nanoid();
  db.insert(analyticsRuns)
    .values({
      id: runId,
      moduleType: "calibration_brier",
      title: input.title,
      seed: null,
      inputJson: JSON.stringify(input),
      resultJson: JSON.stringify({
        ...result,
        buckets: fullResult.buckets,
      }),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .run();

  writeActivity({
    actionType: "analytics.run.calibration",
    summary: `Ran calibration analysis ${input.title}`,
    maybeMetadata: {
      runId,
      sampleSize: input.predictions.length,
    },
  });
  return { runId, result: fullResult };
};

export const rerunAnalyticsWithPatch = (
  runId: string,
  patch: Record<string, unknown>,
): { newRunId: string } => {
  const maybeExistingRun = getAnalyticsRunById(runId);
  if (!maybeExistingRun) {
    throw new Error("Run not found.");
  }

  const baseInput = JSON.parse(maybeExistingRun.inputJson) as Record<string, unknown>;
  const nextInput = {
    ...baseInput,
    ...patch,
  };

  if (maybeExistingRun.moduleType === "monte_carlo_binary") {
    const result = runBinaryPayoffMonteCarlo({
      assumedProbability: Number(nextInput.assumedProbability),
      yesPriceCents: Number(nextInput.yesPriceCents),
      payoutIfYesCents: Number(nextInput.payoutIfYesCents),
      trials: Number(nextInput.trials),
      seed: Number(nextInput.seed),
      confidenceLevel: nextInput.confidenceLevel as 0.9 | 0.95 | 0.99,
      ticker: (nextInput.maybeTicker ?? undefined) as string | undefined,
    });
    const newRunId = nanoid();
    db.insert(analyticsRuns)
      .values({
        id: newRunId,
        moduleType: "monte_carlo_binary",
        title: `${maybeExistingRun.title} (rerun)`,
        seed: `${nextInput.seed ?? ""}`,
        inputJson: JSON.stringify(nextInput),
        resultJson: JSON.stringify(result),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      })
      .run();
    return { newRunId };
  }

  const predictions = (nextInput.predictions ?? []) as number[];
  const outcomes = (nextInput.outcomes ?? []) as number[];
  const result = buildCalibrationSummary(
    predictions,
    outcomes,
    Number(nextInput.maybeBucketCount ?? 10),
  );
  const newRunId = nanoid();
  db.insert(analyticsRuns)
    .values({
      id: newRunId,
      moduleType: "calibration_brier",
      title: `${maybeExistingRun.title} (rerun)`,
      seed: null,
      inputJson: JSON.stringify(nextInput),
      resultJson: JSON.stringify(result),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .run();
  return { newRunId };
};

export const buildCalibrationDatasetFromMirror = (input: {
  maybeLimit?: number;
  maybeTicker?: string;
}): { predictions: number[]; outcomes: number[]; sampleSize: number } => {
  const maybeLimit = Math.max(1, input.maybeLimit ?? 500);
  const fills = db.select().from(kalshiFills).limit(maybeLimit).all();

  const predictions: number[] = [];
  const outcomes: number[] = [];
  for (const fill of fills) {
    if (input.maybeTicker && fill.ticker !== input.maybeTicker) {
      continue;
    }

    const maybeMarket = db
      .select()
      .from(kalshiMarketsCache)
      .where(eq(kalshiMarketsCache.ticker, fill.ticker))
      .get();

    if (!maybeMarket) {
      continue;
    }

    let maybeOutcome: number | undefined;
    try {
      const raw = JSON.parse(maybeMarket.rawJson) as {
        result?: "yes" | "no" | "";
      };
      if (raw.result === "yes") {
        maybeOutcome = 1;
      }
      if (raw.result === "no") {
        maybeOutcome = 0;
      }
    } catch {
      maybeOutcome = undefined;
    }
    if (maybeOutcome === undefined) {
      continue;
    }

    const maybeYesPrice = fill.yesPrice ?? null;
    const maybeNoPrice = fill.noPrice ?? null;
    let prediction = 0.5;
    if (maybeYesPrice !== null) {
      prediction = maybeYesPrice / 100;
    } else if (maybeNoPrice !== null) {
      prediction = 1 - maybeNoPrice / 100;
    }

    if (fill.side === "no") {
      prediction = 1 - prediction;
    }
    predictions.push(Math.max(0, Math.min(1, prediction)));
    outcomes.push(maybeOutcome);
  }

  return {
    predictions,
    outcomes,
    sampleSize: predictions.length,
  };
};
