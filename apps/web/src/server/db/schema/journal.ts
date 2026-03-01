import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tradeJournalEntries = sqliteTable("trade_journal_entries", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  bodyMarkdown: text("body_markdown").notNull(),
  maybeOrderId: text("maybe_order_id"),
  maybeFillId: text("maybe_fill_id"),
  maybeMarketTicker: text("maybe_market_ticker"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
