export class KalshiClientError extends Error {
  public readonly code:
    | "auth_error"
    | "rate_limited"
    | "network_error"
    | "validation_error"
    | "http_error";

  public readonly status?: number;
  public readonly details?: string;

  public constructor(options: {
    message: string;
    code: "auth_error" | "rate_limited" | "network_error" | "validation_error" | "http_error";
    status?: number;
    details?: string;
  }) {
    super(options.message);
    this.name = "KalshiClientError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export const mapErrorToUserMessage = (error: unknown): string => {
  if (!(error instanceof KalshiClientError)) {
    return "Unexpected request failure. Check your network connection and try again.";
  }

  if (error.code === "auth_error") {
    return "Authentication failed. Verify API key id, private key file path, and system time.";
  }

  if (error.code === "rate_limited") {
    return "Kalshi rate limit reached. Please wait briefly and retry.";
  }

  if (error.code === "validation_error") {
    return `Invalid Kalshi response payload: ${error.details ?? "unknown schema mismatch."}`;
  }

  if (error.code === "network_error") {
    return "Network error while reaching Kalshi. Confirm internet access and endpoint environment.";
  }

  return `Kalshi request failed with status ${error.status ?? "unknown"}.`;
};
