import { desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, nowIso } from "../db/client";
import { activityLog } from "../db/schema";

export const writeActivity = (input: {
  actionType: string;
  summary: string;
  maybeMetadata?: Record<string, unknown>;
}): void => {
  db.insert(activityLog)
    .values({
      id: nanoid(),
      actionType: input.actionType,
      summary: input.summary,
      metadataJson: JSON.stringify(input.maybeMetadata ?? {}),
      createdAt: nowIso(),
    })
    .run();
};

export const listActivity = (limit = 100) =>
  db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit).all();
