export class FixedWindowRateLimiter {
  private readonly maxRequestsPerSecond: number;
  private requestCount = 0;
  private windowStartMs = Date.now();

  public constructor(maxRequestsPerSecond: number) {
    this.maxRequestsPerSecond = Math.max(1, maxRequestsPerSecond);
  }

  public async acquire(): Promise<void> {
    const now = Date.now();
    const elapsedMs = now - this.windowStartMs;

    if (elapsedMs >= 1_000) {
      this.windowStartMs = now;
      this.requestCount = 0;
    }

    if (this.requestCount < this.maxRequestsPerSecond) {
      this.requestCount += 1;
      return;
    }

    const sleepMs = Math.max(1, 1_000 - elapsedMs);
    await new Promise((resolve) => {
      setTimeout(resolve, sleepMs);
    });

    this.windowStartMs = Date.now();
    this.requestCount = 1;
  }
}
