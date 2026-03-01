import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const activityLog = sqliteTable("activity_log", {
  id: text("id").primaryKey(),
  actionType: text("action_type").notNull(),
  summary: text("summary").notNull(),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: text("created_at").notNull(),
});
