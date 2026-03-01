import type { KalshiEnvironment } from "@kalshi-quant-dashboard/shared-types";
import type { z } from "zod";
import { resolveKalshiBaseUrl } from "./environment";
import { KalshiClientError } from "./errors";
import { KalshiHttpClient } from "./http";
import {
  getEventsResponseSchema,
  getMarketsResponseSchema,
  getTradesResponseSchema,
  orderbookResponseSchema,
} from "./types";

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

export class KalshiPublicClient {
  private readonly httpClient: KalshiHttpClient;

  public constructor(environment: KalshiEnvironment, maybeFetchImplementation?: typeof fetch) {
    this.httpClient = new KalshiHttpClient({
      baseUrl: resolveKalshiBaseUrl(environment),
      maybeReadLimitPerSecond: 20,
      maybeWriteLimitPerSecond: 10,
      maybeFetchImplementation,
    });
  }

  public async getMarkets(query: {
    maybeStatus?: string;
    maybeCursor?: string;
    maybeLimit?: number;
    maybeSeriesTicker?: string;
    maybeSearchTickerList?: string;
  }) {
    const queryString = buildQueryString({
      status: query.maybeStatus,
      cursor: query.maybeCursor,
      limit: query.maybeLimit,
      series_ticker: query.maybeSeriesTicker,
      tickers: query.maybeSearchTickerList,
    });

    const payload = await this.httpClient.requestJson<unknown>({
      method: "GET",
      path: `/markets${queryString}`,
    });

    return parseOrThrow(getMarketsResponseSchema, payload);
  }

  public async getEvents(query: {
    maybeStatus?: string;
    maybeCursor?: string;
    maybeLimit?: number;
    maybeWithNestedMarkets?: boolean;
  }) {
    const queryString = buildQueryString({
      status: query.maybeStatus,
      cursor: query.maybeCursor,
      limit: query.maybeLimit,
      with_nested_markets: query.maybeWithNestedMarkets,
    });

    const payload = await this.httpClient.requestJson<unknown>({
      method: "GET",
      path: `/events${queryString}`,
    });

    return parseOrThrow(getEventsResponseSchema, payload);
  }

  public async getMarketOrderbook(ticker: string, maybeDepth?: number) {
    const queryString = buildQueryString({
      depth: maybeDepth,
    });
    const payload = await this.httpClient.requestJson<unknown>({
      method: "GET",
      path: `/markets/${ticker}/orderbook${queryString}`,
    });

    return parseOrThrow(orderbookResponseSchema, payload);
  }

  public async getTrades(query: {
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
    const payload = await this.httpClient.requestJson<unknown>({
      method: "GET",
      path: `/markets/trades${queryString}`,
    });

    return parseOrThrow(getTradesResponseSchema, payload);
  }
}
