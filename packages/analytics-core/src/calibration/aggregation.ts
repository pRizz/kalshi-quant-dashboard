import type { CalibrationBucket, CalibrationSummary } from "../types";
import { calculateBrierScore } from "./brier-score";

const createBuckets = (bucketCount: number): CalibrationBucket[] => {
  const width = 1 / bucketCount;
  const buckets: CalibrationBucket[] = [];

  for (let index = 0; index < bucketCount; index += 1) {
    const bucketLower = index * width;
    const bucketUpper = index === bucketCount - 1 ? 1 : (index + 1) * width;
    buckets.push({
      bucketLower,
      bucketUpper,
      meanPrediction: 0,
      observedFrequency: 0,
      count: 0,
    });
  }

  return buckets;
};

export const buildCalibrationSummary = (
  predictions: number[],
  outcomes: number[],
  maybeBucketCount?: number,
): CalibrationSummary => {
  const bucketCount = Math.max(2, maybeBucketCount ?? 10);
  const buckets = createBuckets(bucketCount);

  for (let index = 0; index < predictions.length; index += 1) {
    const prediction = predictions[index] ?? 0;
    const outcome = outcomes[index] ?? 0;
    const position = Math.min(
      bucketCount - 1,
      Math.floor(Math.max(0, Math.min(0.999999, prediction)) * bucketCount),
    );
    const maybeBucket = buckets[position];
    if (!maybeBucket) {
      continue;
    }

    maybeBucket.count += 1;
    maybeBucket.meanPrediction += prediction;
    maybeBucket.observedFrequency += outcome;
  }

  const normalized = buckets.map((bucket) => {
    if (bucket.count === 0) {
      return bucket;
    }

    return {
      ...bucket,
      meanPrediction: bucket.meanPrediction / bucket.count,
      observedFrequency: bucket.observedFrequency / bucket.count,
    };
  });

  return {
    brier: calculateBrierScore({ predictions, outcomes }),
    buckets: normalized,
  };
};
