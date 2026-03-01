import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "../db/client";
import { kalshiEventsCache, kalshiMarketsCache } from "../db/schema";

export const listMarkets = (query: {
  maybeSearch?: string;
  maybeStatus?: string;
}) => {
  const filters = [];
  if (query.maybeSearch) {
    filters.push(
      or(
        like(kalshiMarketsCache.ticker, `%${query.maybeSearch}%`),
        like(kalshiMarketsCache.title, `%${query.maybeSearch}%`),
      ),
    );
  }
  if (query.maybeStatus) {
    filters.push(eq(kalshiMarketsCache.status, query.maybeStatus));
  }

  return db
    .select()
    .from(kalshiMarketsCache)
    .where(filters.length === 0 ? undefined : and(...filters))
    .orderBy(desc(kalshiMarketsCache.updatedAt))
    .limit(1000)
    .all();
};

export const getMarketDetail = (ticker: string) =>
  db.select().from(kalshiMarketsCache).where(eq(kalshiMarketsCache.ticker, ticker)).get();

export const listEvents = () =>
  db.select().from(kalshiEventsCache).orderBy(desc(kalshiEventsCache.updatedAt)).limit(500).all();
