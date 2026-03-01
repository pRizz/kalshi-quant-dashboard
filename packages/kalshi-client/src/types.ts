import { z } from "zod";

export const marketSchema = z.object({
  ticker: z.string(),
  event_ticker: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  status: z.string().optional(),
  yes_bid: z.number().optional(),
  yes_ask: z.number().optional(),
  yes_bid_dollars: z.string().optional(),
  yes_ask_dollars: z.string().optional(),
  last_price: z.number().optional(),
  last_price_dollars: z.string().optional(),
  volume: z.number().optional(),
  volume_fp: z.string().optional(),
});

export const getMarketsResponseSchema = z.object({
  markets: z.array(marketSchema),
  cursor: z.string().optional().default(""),
});

export const eventSchema = z.object({
  event_ticker: z.string(),
  title: z.string(),
  category: z.string().optional(),
});

export const getEventsResponseSchema = z.object({
  events: z.array(eventSchema),
  cursor: z.string().optional().default(""),
});

export const orderbookResponseSchema = z.object({
  orderbook: z
    .object({
      yes: z.array(z.tuple([z.number(), z.number()])).optional(),
      no: z.array(z.tuple([z.number(), z.number()])).optional(),
    })
    .optional(),
  orderbook_fp: z
    .object({
      yes_dollars: z.array(z.tuple([z.string(), z.string()])).optional(),
      no_dollars: z.array(z.tuple([z.string(), z.string()])).optional(),
    })
    .optional(),
});

export const tradeSchema = z.object({
  trade_id: z.string(),
  ticker: z.string(),
  yes_price: z.number().optional(),
  no_price: z.number().optional(),
  yes_price_dollars: z.string().optional(),
  no_price_dollars: z.string().optional(),
  count: z.number().optional(),
  count_fp: z.string().optional(),
  created_time: z.string().optional(),
});

export const getTradesResponseSchema = z.object({
  trades: z.array(tradeSchema),
  cursor: z.string().optional().default(""),
});

export const orderSchema = z.object({
  order_id: z.string(),
  ticker: z.string(),
  side: z.enum(["yes", "no"]),
  action: z.enum(["buy", "sell"]),
  status: z.enum(["resting", "canceled", "executed"]),
  yes_price: z.number().optional(),
  no_price: z.number().optional(),
  initial_count: z.number().optional(),
  remaining_count: z.number().optional(),
  fill_count: z.number().optional(),
  last_update_time: z.string().nullable().optional(),
  created_time: z.string().nullable().optional(),
  taker_fees: z.number().optional(),
  maker_fees: z.number().optional(),
});

export const getOrdersResponseSchema = z.object({
  orders: z.array(orderSchema),
  cursor: z.string().optional().default(""),
});

export const createOrderRequestSchema = z.object({
  ticker: z.string().min(1),
  side: z.enum(["yes", "no"]),
  action: z.enum(["buy", "sell"]),
  count: z.number().int().min(1),
  yes_price: z.number().int().min(1).max(99).optional(),
  no_price: z.number().int().min(1).max(99).optional(),
  type: z.enum(["limit", "market"]).optional(),
  time_in_force: z.enum(["fill_or_kill", "good_till_canceled", "immediate_or_cancel"]).optional(),
  post_only: z.boolean().optional(),
  reduce_only: z.boolean().optional(),
  buy_max_cost: z.number().int().optional(),
});

export const createOrderResponseSchema = z.object({
  order: orderSchema,
});

export const cancelOrderResponseSchema = z.object({
  order: orderSchema,
  reduced_by: z.number(),
  reduced_by_fp: z.string(),
});

export const fillSchema = z.object({
  fill_id: z.string(),
  trade_id: z.string(),
  order_id: z.string(),
  ticker: z.string(),
  side: z.enum(["yes", "no"]),
  action: z.enum(["buy", "sell"]),
  count: z.number(),
  count_fp: z.string(),
  yes_price: z.number().optional(),
  no_price: z.number().optional(),
  created_time: z.string().optional(),
  ts: z.number().optional(),
});

export const getFillsResponseSchema = z.object({
  fills: z.array(fillSchema),
  cursor: z.string().optional().default(""),
});

export const marketPositionSchema = z.object({
  ticker: z.string(),
  position: z.number(),
  position_fp: z.string(),
  total_traded: z.number(),
  realized_pnl: z.number(),
});

export const eventPositionSchema = z.object({
  event_ticker: z.string(),
  total_cost: z.number(),
  realized_pnl: z.number(),
});

export const getPositionsResponseSchema = z.object({
  cursor: z.string().optional().default(""),
  market_positions: z.array(marketPositionSchema),
  event_positions: z.array(eventPositionSchema),
});

export const getBalanceResponseSchema = z.object({
  balance: z.number(),
  portfolio_value: z.number(),
  updated_ts: z.number(),
});

export const getHistoricalCutoffResponseSchema = z.object({
  market_settled_ts: z.string(),
  trades_created_ts: z.string(),
  orders_updated_ts: z.string(),
});

export type Market = z.infer<typeof marketSchema>;
export type Event = z.infer<typeof eventSchema>;
export type Order = z.infer<typeof orderSchema>;
export type Fill = z.infer<typeof fillSchema>;
export type MarketPosition = z.infer<typeof marketPositionSchema>;
export type EventPosition = z.infer<typeof eventPositionSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
