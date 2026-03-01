import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, nowIso } from "../db/client";
import {
  kalshiEventPositions,
  kalshiFills,
  kalshiMarketPositions,
  kalshiOrders,
} from "../db/schema";
import {
  reconcileBalance,
  reconcileFills,
  reconcileOrders,
  reconcilePositions,
} from "../sync/reconcile";

export const isMockCredential = (input: {
  apiKeyId: string;
  privateKeyPath: string;
}): boolean => input.apiKeyId.startsWith("mock_") || input.privateKeyPath.startsWith("mock://");

export const placeMockOrder = (input: {
  ticker: string;
  side: "yes" | "no";
  action: "buy" | "sell";
  count: number;
  maybeYesPrice?: number;
  maybeNoPrice?: number;
}) => {
  const order = {
    order_id: nanoid(),
    ticker: input.ticker,
    side: input.side,
    action: input.action,
    status: "resting" as const,
    yes_price: input.maybeYesPrice ?? null,
    no_price: input.maybeNoPrice ?? null,
    initial_count: input.count,
    remaining_count: input.count,
    fill_count: 0,
    taker_fees: 0,
    maker_fees: 0,
    created_time: nowIso(),
    last_update_time: nowIso(),
  };
  reconcileOrders([order]);
  return order;
};

export const cancelMockOrder = (orderId: string) => {
  const maybeOrder = db.select().from(kalshiOrders).where(eq(kalshiOrders.orderId, orderId)).get();
  if (!maybeOrder) {
    throw new Error("Order not found.");
  }

  const canceled = {
    order_id: maybeOrder.orderId,
    ticker: maybeOrder.ticker,
    side: maybeOrder.side,
    action: maybeOrder.action,
    status: "canceled" as const,
    yes_price: maybeOrder.yesPrice,
    no_price: maybeOrder.noPrice,
    initial_count: maybeOrder.initialCount,
    remaining_count: 0,
    fill_count: maybeOrder.fillCount ?? 0,
    taker_fees: maybeOrder.takerFees ?? 0,
    maker_fees: maybeOrder.makerFees ?? 0,
    created_time: maybeOrder.createdTime,
    last_update_time: nowIso(),
  };
  reconcileOrders([canceled]);
  return {
    order: canceled,
    reduced_by: maybeOrder.remainingCount ?? 0,
    reduced_by_fp: `${maybeOrder.remainingCount ?? 0}.00`,
  };
};

export const syncMockPortfolio = () => {
  const recentOrders = db
    .select()
    .from(kalshiOrders)
    .orderBy(desc(kalshiOrders.updatedTime))
    .limit(25)
    .all();

  const fills = recentOrders
    .filter((order) => order.status !== "canceled")
    .slice(0, 10)
    .map((order) => ({
      fill_id: `mock-fill-${order.orderId}`,
      trade_id: `mock-fill-${order.orderId}`,
      order_id: order.orderId,
      ticker: order.ticker,
      side: order.side,
      action: order.action,
      count: Math.max(1, Math.floor((order.initialCount ?? 1) / 2)),
      count_fp: `${Math.max(1, Math.floor((order.initialCount ?? 1) / 2))}.00`,
      yes_price: order.yesPrice ?? 50,
      no_price: order.noPrice ?? 50,
      created_time: nowIso(),
      ts: Date.now(),
    }));
  reconcileFills(fills);

  const currentFills = db.select().from(kalshiFills).all();
  const marketPositionMap = new Map<
    string,
    { position: number; totalTraded: number; realizedPnl: number }
  >();
  for (const fill of currentFills) {
    const maybeCurrent = marketPositionMap.get(fill.ticker) ?? {
      position: 0,
      totalTraded: 0,
      realizedPnl: 0,
    };
    const signedCount = fill.side === "yes" ? fill.count : -fill.count;
    maybeCurrent.position += signedCount;
    maybeCurrent.totalTraded += fill.count * ((fill.yesPrice ?? 50) / 100);
    maybeCurrent.realizedPnl += 0;
    marketPositionMap.set(fill.ticker, maybeCurrent);
  }

  reconcilePositions({
    market_positions: [...marketPositionMap.entries()].map(([ticker, values]) => ({
      ticker,
      position: values.position,
      position_fp: `${values.position}.00`,
      total_traded: Math.round(values.totalTraded * 100),
      realized_pnl: values.realizedPnl,
    })),
    event_positions: [],
  });

  reconcileBalance({
    balance: 100_000,
    portfolio_value: 100_000,
    updated_ts: Date.now(),
  });
};
