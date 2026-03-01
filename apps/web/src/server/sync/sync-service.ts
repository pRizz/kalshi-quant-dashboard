import {
  KalshiPrivateClient,
  KalshiPublicClient,
  loadPrivateKeyPem,
} from "@kalshi-quant-dashboard/kalshi-client";
import type { KalshiEnvironment } from "@kalshi-quant-dashboard/shared-types";
import { and, count, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { writeActivity } from "../audit/activity-log-service";
import { db, nowIso } from "../db/client";
import { kalshiFills, kalshiMarketPositions, kalshiOrders, syncCheckpoints } from "../db/schema";
import { getSecretReadPolicy } from "../settings/settings-service";
import { assertTradingEnabledForPrivateRequest } from "../trading/guards";
import { isMockCredential, syncMockPortfolio } from "../trading/mock-trading";
import { getTradingGuardState } from "../trading/trading-context";
import {
  reconcileBalance,
  reconcileEvents,
  reconcileFills,
  reconcileMarkets,
  reconcileOrders,
  reconcilePositions,
} from "./reconcile";

const upsertCheckpoint = (input: {
  environment: KalshiEnvironment;
  endpoint: string;
  maybeCursor?: string;
  maybeCutoffTimestamp?: string;
}): void => {
  const maybeExisting = db
    .select()
    .from(syncCheckpoints)
    .where(
      and(
        eq(syncCheckpoints.environment, input.environment),
        eq(syncCheckpoints.endpoint, input.endpoint),
      ),
    )
    .get();

  if (maybeExisting) {
    db.update(syncCheckpoints)
      .set({
        cursor: input.maybeCursor ?? null,
        cutoffTimestamp: input.maybeCutoffTimestamp ?? null,
        updatedAt: nowIso(),
      })
      .where(eq(syncCheckpoints.id, maybeExisting.id))
      .run();
    return;
  }

  db.insert(syncCheckpoints)
    .values({
      id: nanoid(),
      environment: input.environment,
      endpoint: input.endpoint,
      cursor: input.maybeCursor ?? null,
      cutoffTimestamp: input.maybeCutoffTimestamp ?? null,
      updatedAt: nowIso(),
    })
    .run();
};

export const syncPublicMarketData = async (
  environment: KalshiEnvironment,
): Promise<{
  marketCount: number;
  eventCount: number;
}> => {
  const client = new KalshiPublicClient(environment);
  const [marketsResponse, eventsResponse] = await Promise.all([
    client.getMarkets({
      maybeStatus: "open",
      maybeLimit: 200,
    }),
    client.getEvents({
      maybeStatus: "open",
      maybeLimit: 200,
    }),
  ]);

  reconcileMarkets(marketsResponse.markets);
  reconcileEvents(eventsResponse.events);
  upsertCheckpoint({
    environment,
    endpoint: "public_markets",
    maybeCursor: marketsResponse.cursor,
  });
  upsertCheckpoint({
    environment,
    endpoint: "public_events",
    maybeCursor: eventsResponse.cursor,
  });

  writeActivity({
    actionType: "sync.public",
    summary: `Synced public market data (${environment})`,
    maybeMetadata: {
      marketCount: marketsResponse.markets.length,
      eventCount: eventsResponse.events.length,
    },
  });

  return {
    marketCount: marketsResponse.markets.length,
    eventCount: eventsResponse.events.length,
  };
};

const createAuthedPrivateClient = async (
  environment: KalshiEnvironment,
): Promise<KalshiPrivateClient> => {
  const state = getTradingGuardState();
  assertTradingEnabledForPrivateRequest(state);
  const secretReadPolicy = getSecretReadPolicy(environment);
  assertTradingEnabledForPrivateRequest({
    mode: state.mode,
    secretReadPolicy,
  });
  const privateKeyPem = await loadPrivateKeyPem(secretReadPolicy.privateKeyPath);
  return new KalshiPrivateClient({
    environment,
    apiKeyId: secretReadPolicy.apiKeyId,
    privateKeyPem,
  });
};

export const syncPrivatePortfolioData = async (
  environment: KalshiEnvironment,
): Promise<{
  orderCount: number;
  fillCount: number;
  marketPositionCount: number;
}> => {
  const state = getTradingGuardState();
  const secretReadPolicy = getSecretReadPolicy(environment);
  assertTradingEnabledForPrivateRequest({
    mode: state.mode,
    secretReadPolicy,
  });
  if (isMockCredential(secretReadPolicy)) {
    syncMockPortfolio();
    const orderCount = db.select({ value: count() }).from(kalshiOrders).get()?.value ?? 0;
    const fillCount = db.select({ value: count() }).from(kalshiFills).get()?.value ?? 0;
    const marketPositionCount =
      db.select({ value: count() }).from(kalshiMarketPositions).get()?.value ?? 0;
    writeActivity({
      actionType: "sync.private.mock",
      summary: "Synced private portfolio in mock mode",
      maybeMetadata: {
        orderCount,
        fillCount,
        marketPositionCount,
      },
    });
    return {
      orderCount,
      fillCount,
      marketPositionCount,
    };
  }

  const client = await createAuthedPrivateClient(environment);
  const cutoff = await client.getHistoricalCutoff();

  const [
    ordersResponse,
    fillsResponse,
    positionsResponse,
    balanceResponse,
    historicalOrders,
    historicalFills,
  ] = await Promise.all([
    client.getOrders({ maybeLimit: 200 }),
    client.getFills({ maybeLimit: 200 }),
    client.getPositions({ maybeLimit: 200, maybeCountFilter: "position,total_traded" }),
    client.getBalance(),
    client.getHistoricalOrders({ maybeLimit: 200 }),
    client.getHistoricalFills({ maybeLimit: 200 }),
  ]);

  reconcileOrders([...ordersResponse.orders, ...historicalOrders.orders]);
  reconcileFills([...fillsResponse.fills, ...historicalFills.fills]);
  reconcilePositions(positionsResponse);
  reconcileBalance(balanceResponse);

  upsertCheckpoint({
    environment,
    endpoint: "orders",
    maybeCursor: ordersResponse.cursor,
    maybeCutoffTimestamp: cutoff.orders_updated_ts,
  });
  upsertCheckpoint({
    environment,
    endpoint: "fills",
    maybeCursor: fillsResponse.cursor,
    maybeCutoffTimestamp: cutoff.trades_created_ts,
  });
  upsertCheckpoint({
    environment,
    endpoint: "positions",
    maybeCursor: positionsResponse.cursor,
  });

  writeActivity({
    actionType: "sync.private",
    summary: `Synced private portfolio (${environment})`,
    maybeMetadata: {
      orders: ordersResponse.orders.length + historicalOrders.orders.length,
      fills: fillsResponse.fills.length + historicalFills.fills.length,
      positions: positionsResponse.market_positions.length,
    },
  });

  return {
    orderCount: ordersResponse.orders.length + historicalOrders.orders.length,
    fillCount: fillsResponse.fills.length + historicalFills.fills.length,
    marketPositionCount: positionsResponse.market_positions.length,
  };
};
