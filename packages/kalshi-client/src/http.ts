import { KalshiClientError } from "./errors";
import { FixedWindowRateLimiter } from "./rate-limit";

export type KalshiHttpClientOptions = {
  baseUrl: string;
  maybeReadLimitPerSecond?: number;
  maybeWriteLimitPerSecond?: number;
  maybeFetchImplementation?: typeof fetch;
};

type HttpMethod = "GET" | "POST" | "DELETE";

const shouldRetryStatus = (status: number): boolean => status === 429 || status >= 500;

const waitWithBackoff = async (attempt: number): Promise<void> => {
  const baseMs = 150;
  const multiplier = 2 ** attempt;
  await new Promise((resolve) => {
    setTimeout(resolve, baseMs * multiplier);
  });
};

export class KalshiHttpClient {
  private readonly baseUrl: string;
  private readonly fetchImplementation: typeof fetch;
  private readonly readLimiter: FixedWindowRateLimiter;
  private readonly writeLimiter: FixedWindowRateLimiter;

  public constructor(options: KalshiHttpClientOptions) {
    this.baseUrl = options.baseUrl;
    this.fetchImplementation = options.maybeFetchImplementation ?? fetch;
    this.readLimiter = new FixedWindowRateLimiter(options.maybeReadLimitPerSecond ?? 20);
    this.writeLimiter = new FixedWindowRateLimiter(options.maybeWriteLimitPerSecond ?? 10);
  }

  public async requestJson<TResponse>(options: {
    method: HttpMethod;
    path: string;
    maybeHeaders?: Record<string, string>;
    maybeBody?: unknown;
    maybeRetryAttempts?: number;
  }): Promise<TResponse> {
    const retries = options.maybeRetryAttempts ?? 2;
    const limiter = options.method === "GET" ? this.readLimiter : this.writeLimiter;
    let maybeLastError: unknown = undefined;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      await limiter.acquire();
      try {
        const url = `${this.baseUrl}${options.path}`;
        const response = await this.fetchImplementation(url, {
          method: options.method,
          headers: {
            "content-type": "application/json",
            ...(options.maybeHeaders ?? {}),
          },
          body: options.maybeBody === undefined ? undefined : JSON.stringify(options.maybeBody),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new KalshiClientError({
              message: "Kalshi authentication failed.",
              code: "auth_error",
              status: response.status,
            });
          }

          if (response.status === 429) {
            const rateLimitedError = new KalshiClientError({
              message: "Kalshi rate-limited the request.",
              code: "rate_limited",
              status: response.status,
            });

            if (attempt < retries) {
              maybeLastError = rateLimitedError;
              await waitWithBackoff(attempt);
              continue;
            }

            throw rateLimitedError;
          }

          if (shouldRetryStatus(response.status) && attempt < retries) {
            maybeLastError = new KalshiClientError({
              message: "Transient Kalshi server error.",
              code: "http_error",
              status: response.status,
            });
            await waitWithBackoff(attempt);
            continue;
          }

          throw new KalshiClientError({
            message: "Kalshi request failed.",
            code: "http_error",
            status: response.status,
          });
        }

        const payload = (await response.json()) as TResponse;
        return payload;
      } catch (error) {
        if (error instanceof KalshiClientError) {
          throw error;
        }

        maybeLastError = error;
        if (attempt < retries) {
          await waitWithBackoff(attempt);
          continue;
        }

        throw new KalshiClientError({
          message: "Failed to reach Kalshi API.",
          code: "network_error",
          details: String(maybeLastError),
        });
      }
    }

    throw new KalshiClientError({
      message: "Kalshi request failed after retries.",
      code: "network_error",
      details: String(maybeLastError),
    });
  }
}
