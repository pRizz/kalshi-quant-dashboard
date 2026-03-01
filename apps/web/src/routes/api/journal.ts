import { jsonResponse } from "~/server/http/json-response";
import {
  createJournalEntry,
  deleteJournalEntry,
  listJournalEntries,
} from "~/server/journal/journal-service";

export const GET = async () =>
  jsonResponse({
    entries: listJournalEntries(),
  });

export const POST = async ({ request }: { request: Request }) => {
  const payload = (await request.json()) as {
    title: string;
    bodyMarkdown: string;
    maybeOrderId?: string;
    maybeFillId?: string;
    maybeMarketTicker?: string;
  };
  const id = createJournalEntry(payload);
  return jsonResponse({
    ok: true,
    id,
  });
};

export const DELETE = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return jsonResponse(
      {
        ok: false,
      },
      {
        status: 400,
      },
    );
  }

  deleteJournalEntry(id);
  return jsonResponse({
    ok: true,
  });
};
