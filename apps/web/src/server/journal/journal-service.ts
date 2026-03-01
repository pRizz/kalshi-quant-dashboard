import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { writeActivity } from "../audit/activity-log-service";
import { db, nowIso } from "../db/client";
import { tradeJournalEntries } from "../db/schema";

export const listJournalEntries = () =>
  db.select().from(tradeJournalEntries).orderBy(desc(tradeJournalEntries.updatedAt)).all();

export const createJournalEntry = (input: {
  title: string;
  bodyMarkdown: string;
  maybeOrderId?: string;
  maybeFillId?: string;
  maybeMarketTicker?: string;
}) => {
  const id = nanoid();
  db.insert(tradeJournalEntries)
    .values({
      id,
      title: input.title,
      bodyMarkdown: input.bodyMarkdown,
      maybeOrderId: input.maybeOrderId ?? null,
      maybeFillId: input.maybeFillId ?? null,
      maybeMarketTicker: input.maybeMarketTicker ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .run();
  writeActivity({
    actionType: "journal.create",
    summary: `Created journal entry ${input.title}`,
    maybeMetadata: {
      id,
    },
  });
  return id;
};

export const deleteJournalEntry = (id: string) => {
  db.delete(tradeJournalEntries).where(eq(tradeJournalEntries.id, id)).run();
  writeActivity({
    actionType: "journal.delete",
    summary: `Deleted journal entry ${id}`,
  });
};
