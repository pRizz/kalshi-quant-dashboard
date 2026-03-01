import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const annotations = sqliteTable("annotations", {
  id: text("id").primaryKey(),
  targetType: text("target_type", {
    enum: ["market", "event", "order", "fill", "journal_entry", "analytics_run"],
  }).notNull(),
  targetId: text("target_id").notNull(),
  title: text("title").notNull(),
  contentMarkdown: text("content_markdown").notNull(),
  linksJson: text("links_json").notNull().default("[]"),
  customFieldsJson: text("custom_fields_json").notNull().default("{}"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  createdAt: text("created_at").notNull(),
});

export const annotationTags = sqliteTable("annotation_tags", {
  id: text("id").primaryKey(),
  annotationId: text("annotation_id").notNull(),
  tagId: text("tag_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const entityTags = sqliteTable("entity_tags", {
  id: text("id").primaryKey(),
  entityType: text("entity_type", {
    enum: ["market", "event", "order", "fill", "journal_entry", "analytics_run"],
  }).notNull(),
  entityId: text("entity_id").notNull(),
  tagId: text("tag_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const savedTableViews = sqliteTable("saved_table_views", {
  id: text("id").primaryKey(),
  tableKey: text("table_key").notNull(),
  viewName: text("view_name").notNull(),
  stateJson: text("state_json").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
