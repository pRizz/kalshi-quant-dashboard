import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import Papa from "papaparse";
import { writeActivity } from "../audit/activity-log-service";
import { db, nowIso } from "../db/client";
import { entityTags, kalshiOrders, savedTableViews, tags } from "../db/schema";

export const listTrades = (query: {
  maybeSearch?: string;
  maybeStatus?: "resting" | "canceled" | "executed";
  maybeTicker?: string;
}) => {
  const filters = [];
  if (query.maybeSearch) {
    filters.push(
      or(
        like(kalshiOrders.ticker, `%${query.maybeSearch}%`),
        like(kalshiOrders.orderId, `%${query.maybeSearch}%`),
      ),
    );
  }
  if (query.maybeStatus) {
    filters.push(eq(kalshiOrders.status, query.maybeStatus));
  }
  if (query.maybeTicker) {
    filters.push(eq(kalshiOrders.ticker, query.maybeTicker));
  }

  return db
    .select()
    .from(kalshiOrders)
    .where(filters.length === 0 ? undefined : and(...filters))
    .orderBy(desc(kalshiOrders.updatedTime), asc(kalshiOrders.orderId))
    .all();
};

export const getTradeDetail = (orderId: string) =>
  db.select().from(kalshiOrders).where(eq(kalshiOrders.orderId, orderId)).get();

export const exportTradesAsCsv = (rows: Array<Record<string, unknown>>) => {
  writeActivity({
    actionType: "trades.export_csv",
    summary: `Exported ${rows.length} rows to CSV`,
  });
  return Papa.unparse(rows, {
    header: true,
  });
};

export const bulkAssignTagToOrders = (orderIds: string[], tagId: string): void => {
  if (orderIds.length === 0) {
    return;
  }

  for (const orderId of orderIds) {
    db.insert(entityTags)
      .values({
        id: nanoid(),
        entityType: "order",
        entityId: orderId,
        tagId,
        createdAt: nowIso(),
      })
      .run();
  }
  writeActivity({
    actionType: "trades.bulk_tag",
    summary: `Bulk tagged ${orderIds.length} orders`,
    maybeMetadata: {
      tagId,
    },
  });
};

export const listOrderTags = (orderId: string) => {
  const tagLinks = db
    .select()
    .from(entityTags)
    .where(and(eq(entityTags.entityType, "order"), eq(entityTags.entityId, orderId)))
    .all();
  const tagIds = tagLinks.map((link) => link.tagId);
  if (tagIds.length === 0) {
    return [];
  }

  return db.select().from(tags).where(inArray(tags.id, tagIds)).all();
};

export const saveTradesView = (input: {
  viewName: string;
  stateJson: string;
  isDefault: boolean;
}) => {
  db.insert(savedTableViews)
    .values({
      id: nanoid(),
      tableKey: "trades",
      viewName: input.viewName,
      stateJson: input.stateJson,
      isDefault: input.isDefault,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .run();
  writeActivity({
    actionType: "trades.view.save",
    summary: `Saved trades view ${input.viewName}`,
  });
};

export const listTradesViews = () =>
  db.select().from(savedTableViews).where(eq(savedTableViews.tableKey, "trades")).all();
