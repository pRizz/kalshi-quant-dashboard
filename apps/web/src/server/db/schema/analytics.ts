import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const analyticsRuns = sqliteTable("analytics_runs", {
  id: text("id").primaryKey(),
  moduleType: text("module_type", { enum: ["monte_carlo_binary", "calibration_brier"] }).notNull(),
  title: text("title").notNull(),
  seed: text("seed"),
  inputJson: text("input_json").notNull(),
  resultJson: text("result_json").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
