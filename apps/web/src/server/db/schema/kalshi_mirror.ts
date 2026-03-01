import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const kalshiOrders = sqliteTable("kalshi_orders", {
  orderId: text("order_id").primaryKey(),
  ticker: text("ticker").notNull(),
  side: text("side", { enum: ["yes", "no"] }).notNull(),
  action: text("action", { enum: ["buy", "sell"] }).notNull(),
  status: text("status", { enum: ["resting", "canceled", "executed"] }).notNull(),
  yesPrice: integer("yes_price"),
  noPrice: integer("no_price"),
  initialCount: integer("initial_count"),
  remainingCount: integer("remaining_count"),
  fillCount: integer("fill_count"),
  takerFees: integer("taker_fees"),
  makerFees: integer("maker_fees"),
  createdTime: text("created_time"),
  updatedTime: text("updated_time"),
});

export const kalshiFills = sqliteTable("kalshi_fills", {
  fillId: text("fill_id").primaryKey(),
  tradeId: text("trade_id").notNull(),
  orderId: text("order_id").notNull(),
  ticker: text("ticker").notNull(),
  side: text("side", { enum: ["yes", "no"] }).notNull(),
  action: text("action", { enum: ["buy", "sell"] }).notNull(),
  count: integer("count").notNull(),
  countFp: text("count_fp").notNull(),
  yesPrice: integer("yes_price"),
  noPrice: integer("no_price"),
  createdTime: text("created_time"),
  ts: integer("ts"),
});

export const kalshiMarketPositions = sqliteTable("kalshi_market_positions", {
  ticker: text("ticker").primaryKey(),
  position: integer("position").notNull(),
  positionFp: text("position_fp").notNull(),
  totalTraded: integer("total_traded").notNull(),
  realizedPnl: integer("realized_pnl").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const kalshiEventPositions = sqliteTable("kalshi_event_positions", {
  eventTicker: text("event_ticker").primaryKey(),
  totalCost: integer("total_cost").notNull(),
  realizedPnl: integer("realized_pnl").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const kalshiBalanceSnapshots = sqliteTable("kalshi_balance_snapshots", {
  id: text("id").primaryKey(),
  balance: integer("balance").notNull(),
  portfolioValue: integer("portfolio_value").notNull(),
  updatedTs: integer("updated_ts").notNull(),
  syncedAt: text("synced_at").notNull(),
});

export const kalshiMarketsCache = sqliteTable("kalshi_markets_cache", {
  ticker: text("ticker").primaryKey(),
  eventTicker: text("event_ticker"),
  title: text("title"),
  status: text("status"),
  lastPriceDollars: text("last_price_dollars"),
  yesAskDollars: text("yes_ask_dollars"),
  yesBidDollars: text("yes_bid_dollars"),
  volumeFp: text("volume_fp"),
  rawJson: text("raw_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const kalshiEventsCache = sqliteTable("kalshi_events_cache", {
  eventTicker: text("event_ticker").primaryKey(),
  title: text("title").notNull(),
  category: text("category"),
  rawJson: text("raw_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const syncCheckpoints = sqliteTable("sync_checkpoints", {
  id: text("id").primaryKey(),
  environment: text("environment", { enum: ["production", "demo"] }).notNull(),
  endpoint: text("endpoint").notNull(),
  cursor: text("cursor"),
  cutoffTimestamp: text("cutoff_timestamp"),
  updatedAt: text("updated_at").notNull(),
});
