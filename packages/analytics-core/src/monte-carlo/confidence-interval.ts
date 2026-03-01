const zMap: Record<0.9 | 0.95 | 0.99, number> = {
  0.9: 1.6448536269514722,
  0.95: 1.959963984540054,
  0.99: 2.5758293035489004,
};

export const mean = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((accumulator, value) => accumulator + value, 0) / values.length;
};

export const sampleVariance = (values: number[], maybeCenter?: number): number => {
  if (values.length <= 1) {
    return 0;
  }

  const center = maybeCenter ?? mean(values);
  const squaredDistance = values.reduce((accumulator, value) => {
    const delta = value - center;
    return accumulator + delta * delta;
  }, 0);

  return squaredDistance / (values.length - 1);
};

export const confidenceInterval = (
  values: number[],
  confidenceLevel: 0.9 | 0.95 | 0.99,
): { lower: number; upper: number; standardError: number } => {
  const average = mean(values);
  const variance = sampleVariance(values, average);
  const standardError = Math.sqrt(variance / Math.max(values.length, 1));
  const zScore = zMap[confidenceLevel];
  const margin = zScore * standardError;

  return {
    lower: average - margin,
    upper: average + margin,
    standardError,
  };
};
