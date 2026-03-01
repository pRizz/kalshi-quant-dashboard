import { desc } from "drizzle-orm";
import { db } from "../db/client";
import {
  kalshiBalanceSnapshots,
  kalshiEventPositions,
  kalshiFills,
  kalshiMarketPositions,
} from "../db/schema";

export const getPortfolioSnapshot = () => {
  const maybeLatestBalance = db
    .select()
    .from(kalshiBalanceSnapshots)
    .orderBy(desc(kalshiBalanceSnapshots.syncedAt))
    .limit(1)
    .get();
  const marketPositions = db.select().from(kalshiMarketPositions).all();
  const eventPositions = db.select().from(kalshiEventPositions).all();
  const fills = db
    .select()
    .from(kalshiFills)
    .orderBy(desc(kalshiFills.createdTime))
    .limit(200)
    .all();
  const balanceHistory = db
    .select()
    .from(kalshiBalanceSnapshots)
    .orderBy(desc(kalshiBalanceSnapshots.syncedAt))
    .limit(100)
    .all();

  return {
    maybeLatestBalance,
    marketPositions,
    eventPositions,
    fills,
    balanceHistory,
  };
};
