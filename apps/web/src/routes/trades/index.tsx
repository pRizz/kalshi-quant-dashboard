import { A } from "@solidjs/router";
import { For, createResource, createSignal, onMount } from "solid-js";
import { type TradeRow, TradesTable } from "~/components/trades/trades-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { postJson } from "~/lib/http-client";

type TradesPayload = {
  trades: TradeRow[];
  savedViews: Array<{ id: string; viewName: string; stateJson: string }>;
};

export default function TradesPage() {
  const [journalTitle, setJournalTitle] = createSignal("");
  const [journalBody, setJournalBody] = createSignal("");
  const [isClientReady, setIsClientReady] = createSignal(false);
  onMount(() => {
    setIsClientReady(true);
  });

  const [data, { refetch }] = createResource(isClientReady, async (ready) => {
    if (!ready) {
      return undefined;
    }

    const response = await fetch("/api/trades");
    return (await response.json()) as TradesPayload;
  });
  const [journal, { refetch: refetchJournal }] = createResource(isClientReady, async (ready) => {
    if (!ready) {
      return undefined;
    }

    const response = await fetch("/api/journal");
    return (await response.json()) as {
      entries: Array<{
        id: string;
        title: string;
        bodyMarkdown: string;
      }>;
    };
  });

  const onBulkTag = async (orderIds: string[], tagId: string) => {
    if (orderIds.length === 0 || tagId.length === 0) {
      return;
    }
    await postJson("/api/trades", {
      kind: "bulk_tag",
      orderIds,
      tagId,
    });
    await refetch();
  };

  const onSaveView = async (input: { viewName: string; stateJson: string }) => {
    if (!input.viewName.trim()) {
      return;
    }

    await postJson("/api/trades", {
      kind: "save_view",
      viewName: input.viewName,
      stateJson: input.stateJson,
      isDefault: false,
    });
    await refetch();
  };

  const onExportCsv = () => {
    window.location.assign("/api/trades/export");
  };

  const createJournal = async () => {
    await postJson("/api/journal", {
      title: journalTitle(),
      bodyMarkdown: journalBody(),
    });
    setJournalTitle("");
    setJournalBody("");
    await refetchJournal();
  };

  return (
    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Trade Journal + Kalshi Mirror</CardTitle>
          <CardDescription>
            Power-user trades table with column chooser, quick filters, saved views, global search,
            CSV export, and bulk tags.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TradesTable
            rows={data()?.trades ?? []}
            maybeSavedViews={data()?.savedViews}
            onSaveView={onSaveView}
            onBulkTag={onBulkTag}
            onExportCsv={onExportCsv}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Trade details</CardTitle>
          <CardDescription>
            Open detailed order cards by navigating to a specific order id.
          </CardDescription>
        </CardHeader>
        <CardContent class="text-sm text-zinc-300">
          <p>
            Example detail route:{" "}
            {data()?.trades[0] ? (
              <A class="text-blue-400 underline" href={`/trades/${data()?.trades[0]?.orderId}`}>
                /trades/{data()?.trades[0]?.orderId}
              </A>
            ) : (
              "Sync and place orders to view details."
            )}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Local trade journal</CardTitle>
          <CardDescription>
            Journal entries are local-only augmentations and never overwrite Kalshi source-of-truth
            records.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <Input
            value={journalTitle()}
            placeholder="Journal title"
            onInput={(event) => {
              setJournalTitle(event.currentTarget.value);
            }}
          />
          <Textarea
            value={journalBody()}
            placeholder="What happened in this trade session?"
            onInput={(event) => {
              setJournalBody(event.currentTarget.value);
            }}
          />
          <button
            type="button"
            class="inline-flex h-9 items-center rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 hover:bg-zinc-800"
            onClick={() => {
              void createJournal();
            }}
          >
            Add journal entry
          </button>
          <For each={journal()?.entries ?? []}>
            {(entry) => (
              <div class="rounded border border-zinc-800 bg-zinc-900 p-3">
                <p class="text-sm font-medium text-zinc-100">{entry.title}</p>
                <p class="mt-1 whitespace-pre-wrap text-xs text-zinc-300">{entry.bodyMarkdown}</p>
              </div>
            )}
          </For>
        </CardContent>
      </Card>
    </div>
  );
}
