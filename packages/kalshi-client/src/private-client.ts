import type { KalshiEnvironment } from "@kalshi-quant-dashboard/shared-types";
import type { z } from "zod";
import { resolveKalshiBaseUrl } from "./environment";
import { KalshiClientError } from "./errors";
import { KalshiHttpClient } from "./http";
import { createKalshiAuthHeaders } from "./signing";
import {
  cancelOrderResponseSchema,
  createOrderRequestSchema,
  createOrderResponseSchema,
  getBalanceResponseSchema,
  getFillsResponseSchema,
  getHistoricalCutoffResponseSchema,
  getOrdersResponseSchema,
  getPositionsResponseSchema,
} from "./types";
import type { CreateOrderRequest } from "./types";

const parseOrThrow = <T>(schema: z.ZodType<T>, payload: unknown): T => {
  const parsed = schema.safeParse(payload);
  if (parsed.success) {
    return parsed.data;
  }

  throw new KalshiClientError({
    message: "Kalshi response validation failed.",
    code: "validation_error",
    details: parsed.error.message,
  });
};

const buildQueryString = (query: Record<string, string | number | boolean | undefined>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }

    search.set(key, `${value}`);
  }
  const queryString = search.toString();
  return queryString.length === 0 ? "" : `?${queryString}`;
};

type KalshiPrivateClientOptions = {
  environment: KalshiEnvironment;
  apiKeyId: string;
  privateKeyPem: string;
  maybeFetchImplementation?: typeof fetch;
};

export class KalshiPrivateClient {
  private readonly httpClient: KalshiHttpClient;
  private readonly apiKeyId: string;
  private readonly privateKeyPem: string;

  public constructor(options: KalshiPrivateClientOptions) {
    this.httpClient = new KalshiHttpClient({
      baseUrl: resolveKalshiBaseUrl(options.environment),
      maybeReadLimitPerSecond: 20,
      maybeWriteLimitPerSecond: 10,
      maybeFetchImplementation: options.maybeFetchImplementation,
    });
    this.apiKeyId = options.apiKeyId;
    this.privateKeyPem = options.privateKeyPem;
  }

  private getAuthHeaders(method: "GET" | "POST" | "DELETE", path: string): Record<string, string> {
    return createKalshiAuthHeaders({
      apiKeyId: this.apiKeyId,
      privateKeyPem: this.privateKeyPem,
      method,
      pathWithMaybeQuery: `/trade-api/v2${path}`,
    });
  }

  public async getBalance(maybeSubaccount?: number) {
    const queryString = buildQueryString({ subaccount: maybeSubaccount });
    const path = `/portfolio/balance${queryString}`;
    const payload = await this.httpClient.requestJson<unknown>({
      method: "GET",
      path,
      maybeHeaders: this.getAuthHeaders("GET", path),
    });

    return parseOrThrow(getBalanceResponseSchema, payload);
  }

  public async getOrders(query: {
    maybeTicker?: string;
    maybeStatus?: string;
    maybeCursor?: string;
    maybeLimit?: number;
    maybeMinTs?: number;
    maybeMaxTs?: number;
    maybeEventTicker?: string;
  }) {
    const queryString = buildQueryString({
      ticker: query.maybeTicker,
      status: query.maybeStatus,
      cursor: query.maybeCursor,
      limit: query.maybeLimit,
      min_ts: query.maybeMinTs,
      max_ts: query.maybeMaxTs,
      event_ticker: query.maybeEventTicker,
    });
    const path = `/portfolio/orders${queryString}`;
    const payload = await this.httpClient.requestJson<unknown>({
      method: "GET",
      path,
      maybeHeaders: this.getAuthHeaders("GET", path),
    });

    return parseOrThrow(getOrdersResponseSchema, payload);
  }

  public async getHistoricalOrders(query: {
    maybeTicker?: string;
    maybeCursor?: string;
    maybeLimit?: number;
    maybeMaxTs?: number;
  }) {
    const queryString = buildQueryString({
      ticker: query.maybeTicker,
      cursor: query.maybeCursor,
      limit: query.maybeLimit,
      max_ts: query.maybeMaxTs,
    });
    const path = `/historical/orders${queryString}`;
    const payload = await this.httpClient.requestJson<unknown>({
      method: "GET",
      path,
      maybeHeaders: this.getAuthHeaders("GET", path),
    });

    return parseOrThrow(getOrdersResponseSchema, payload);
  }

  public async getFills(query: {
    maybeTicker?: string;
    maybeCursor?: string;
    maybeLimit?: number;
    maybeMinTs?: number;
    maybeMaxTs?: number;
  }) {
    const queryString = buildQueryString({
      ticker: query.maybeTicker,
      cursor: query.maybeCursor,
      limit: query.maybeLimit,
      min_ts: query.maybeMinTs,
      max_ts: query.maybeMaxTs,
    });
    const path = `/portfolio/fills${queryString}`;
    const payload = await this.httpClient.requestJson<unknown>({
      method: "GET",
      path,
      maybeHeaders: this.getAuthHeaders("GET", path),
    });

    return parseOrThrow(getFillsResponseSchema, payload);
  }

  public async getHistoricalFills(query: {
    maybeTicker?: string;
    maybeCursor?: string;
    maybeLimit?: number;
    maybeMaxTs?: number;
  }) {
    const queryString = buildQueryString({
      ticker: query.maybeTicker,
      cursor: query.maybeCursor,
      limit: query.maybeLimit,
      max_ts: query.maybeMaxTs,
    });
    const path = `/historical/fills${queryString}`;
    const payload = await this.httpClient.requestJson<unknown>({
      method: "GET",
      path,
      maybeHeaders: this.getAuthHeaders("GET", path),
    });

    return parseOrThrow(getFillsResponseSchema, payload);
  }

  public async getPositions(query: {
    maybeTicker?: string;
    maybeEventTicker?: string;
    maybeCursor?: string;
    maybeLimit?: number;
    maybeCountFilter?: string;
  }) {
    const queryString = buildQueryString({
      ticker: query.maybeTicker,
      event_ticker: query.maybeEventTicker,
      cursor: query.maybeCursor,
      limit: query.maybeLimit,
      count_filter: query.maybeCountFilter,
    });
    const path = `/portfolio/positions${queryString}`;
    const payload = await this.httpClient.requestJson<unknown>({
      method: "GET",
      path,
      maybeHeaders: this.getAuthHeaders("GET", path),
    });

    return parseOrThrow(getPositionsResponseSchema, payload);
  }

  public async getHistoricalCutoff() {
    const path = "/historical/cutoff";
    const payload = await this.httpClient.requestJson<unknown>({
      method: "GET",
      path,
      maybeHeaders: this.getAuthHeaders("GET", path),
    });

    return parseOrThrow(getHistoricalCutoffResponseSchema, payload);
  }

  public async createOrder(orderRequest: CreateOrderRequest) {
    const validated = createOrderRequestSchema.parse(orderRequest);
    const path = "/portfolio/orders";
    const payload = await this.httpClient.requestJson<unknown>({
      method: "POST",
      path,
      maybeHeaders: this.getAuthHeaders("POST", path),
      maybeBody: validated,
    });

    return parseOrThrow(createOrderResponseSchema, payload);
  }

  public async cancelOrder(orderId: string, maybeSubaccount?: number) {
    const queryString = buildQueryString({ subaccount: maybeSubaccount });
    const path = `/portfolio/orders/${orderId}${queryString}`;
    const payload = await this.httpClient.requestJson<unknown>({
      method: "DELETE",
      path,
      maybeHeaders: this.getAuthHeaders("DELETE", path),
    });

    return parseOrThrow(cancelOrderResponseSchema, payload);
  }
}
