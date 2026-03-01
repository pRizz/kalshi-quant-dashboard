import type {
  Event,
  Fill,
  Market,
  MarketPosition,
  Order,
} from "@kalshi-quant-dashboard/kalshi-client";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, nowIso } from "../db/client";
import {
  kalshiBalanceSnapshots,
  kalshiEventPositions,
  kalshiEventsCache,
  kalshiFills,
  kalshiMarketPositions,
  kalshiMarketsCache,
  kalshiOrders,
} from "../db/schema";

const upsertOrder = (order: Order): void => {
  const maybeExisting = db
    .select({ orderId: kalshiOrders.orderId })
    .from(kalshiOrders)
    .where(eq(kalshiOrders.orderId, order.order_id))
    .get();

  const row = {
    orderId: order.order_id,
    ticker: order.ticker,
    side: order.side,
    action: order.action,
    status: order.status,
    yesPrice: order.yes_price ?? null,
    noPrice: order.no_price ?? null,
    initialCount: order.initial_count ?? null,
    remainingCount: order.remaining_count ?? null,
    fillCount: order.fill_count ?? null,
    takerFees: order.taker_fees ?? null,
    makerFees: order.maker_fees ?? null,
    createdTime: order.created_time ?? null,
    updatedTime: order.last_update_time ?? null,
  };

  if (maybeExisting) {
    db.update(kalshiOrders).set(row).where(eq(kalshiOrders.orderId, order.order_id)).run();
    return;
  }

  db.insert(kalshiOrders).values(row).run();
};

export const reconcileOrders = (orders: Order[]): void => {
  for (const order of orders) {
    upsertOrder(order);
  }
};

const upsertFill = (fill: Fill): void => {
  const maybeExisting = db
    .select({ fillId: kalshiFills.fillId })
    .from(kalshiFills)
    .where(eq(kalshiFills.fillId, fill.fill_id))
    .get();

  const row = {
    fillId: fill.fill_id,
    tradeId: fill.trade_id,
    orderId: fill.order_id,
    ticker: fill.ticker,
    side: fill.side,
    action: fill.action,
    count: fill.count,
    countFp: fill.count_fp,
    yesPrice: fill.yes_price ?? null,
    noPrice: fill.no_price ?? null,
    createdTime: fill.created_time ?? null,
    ts: fill.ts ?? null,
  };

  if (maybeExisting) {
    db.update(kalshiFills).set(row).where(eq(kalshiFills.fillId, fill.fill_id)).run();
    return;
  }

  db.insert(kalshiFills).values(row).run();
};

export const reconcileFills = (fills: Fill[]): void => {
  for (const fill of fills) {
    upsertFill(fill);
  }
};

const upsertMarketPosition = (position: MarketPosition): void => {
  const maybeExisting = db
    .select({ ticker: kalshiMarketPositions.ticker })
    .from(kalshiMarketPositions)
    .where(eq(kalshiMarketPositions.ticker, position.ticker))
    .get();

  const row = {
    ticker: position.ticker,
    position: position.position,
    positionFp: position.position_fp,
    totalTraded: position.total_traded,
    realizedPnl: position.realized_pnl,
    updatedAt: nowIso(),
  };

  if (maybeExisting) {
    db.update(kalshiMarketPositions)
      .set(row)
      .where(eq(kalshiMarketPositions.ticker, position.ticker))
      .run();
    return;
  }

  db.insert(kalshiMarketPositions).values(row).run();
};

const upsertEventPosition = (position: {
  event_ticker: string;
  total_cost: number;
  realized_pnl: number;
}): void => {
  const maybeExisting = db
    .select({ eventTicker: kalshiEventPositions.eventTicker })
    .from(kalshiEventPositions)
    .where(eq(kalshiEventPositions.eventTicker, position.event_ticker))
    .get();

  const row = {
    eventTicker: position.event_ticker,
    totalCost: position.total_cost,
    realizedPnl: position.realized_pnl,
    updatedAt: nowIso(),
  };

  if (maybeExisting) {
    db.update(kalshiEventPositions)
      .set(row)
      .where(eq(kalshiEventPositions.eventTicker, position.event_ticker))
      .run();
    return;
  }

  db.insert(kalshiEventPositions).values(row).run();
};

export const reconcilePositions = (positions: {
  market_positions: MarketPosition[];
  event_positions: Array<{ event_ticker: string; total_cost: number; realized_pnl: number }>;
}): void => {
  for (const marketPosition of positions.market_positions) {
    upsertMarketPosition(marketPosition);
  }

  for (const eventPosition of positions.event_positions) {
    upsertEventPosition(eventPosition);
  }
};

export const reconcileBalance = (balance: {
  balance: number;
  portfolio_value: number;
  updated_ts: number;
}): void => {
  db.insert(kalshiBalanceSnapshots)
    .values({
      id: nanoid(),
      balance: balance.balance,
      portfolioValue: balance.portfolio_value,
      updatedTs: balance.updated_ts,
      syncedAt: nowIso(),
    })
    .run();
};

export const reconcileMarkets = (markets: Market[]): void => {
  for (const market of markets) {
    const maybeExisting = db
      .select({ ticker: kalshiMarketsCache.ticker })
      .from(kalshiMarketsCache)
      .where(eq(kalshiMarketsCache.ticker, market.ticker))
      .get();
    const row = {
      ticker: market.ticker,
      eventTicker: market.event_ticker ?? null,
      title: market.title ?? null,
      status: market.status ?? null,
      lastPriceDollars: market.last_price_dollars ?? null,
      yesAskDollars: market.yes_ask_dollars ?? null,
      yesBidDollars: market.yes_bid_dollars ?? null,
      volumeFp: market.volume_fp ?? null,
      rawJson: JSON.stringify(market),
      updatedAt: nowIso(),
    };
    if (maybeExisting) {
      db.update(kalshiMarketsCache)
        .set(row)
        .where(eq(kalshiMarketsCache.ticker, market.ticker))
        .run();
      continue;
    }

    db.insert(kalshiMarketsCache).values(row).run();
  }
};

export const reconcileEvents = (events: Event[]): void => {
  for (const event of events) {
    const maybeExisting = db
      .select({ eventTicker: kalshiEventsCache.eventTicker })
      .from(kalshiEventsCache)
      .where(eq(kalshiEventsCache.eventTicker, event.event_ticker))
      .get();

    const row = {
      eventTicker: event.event_ticker,
      title: event.title,
      category: event.category ?? null,
      rawJson: JSON.stringify(event),
      updatedAt: nowIso(),
    };

    if (maybeExisting) {
      db.update(kalshiEventsCache)
        .set(row)
        .where(eq(kalshiEventsCache.eventTicker, event.event_ticker))
        .run();
      continue;
    }

    db.insert(kalshiEventsCache).values(row).run();
  }
};
