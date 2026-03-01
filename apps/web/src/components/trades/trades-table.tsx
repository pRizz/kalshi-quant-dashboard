import { For, Show, createMemo, createSignal } from "solid-js";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export type TradeRow = {
  orderId: string;
  ticker: string;
  side: "yes" | "no";
  action: "buy" | "sell";
  status: "resting" | "canceled" | "executed";
  yesPrice: number | null;
  noPrice: number | null;
  initialCount: number | null;
  remainingCount: number | null;
  fillCount: number | null;
  updatedTime: string | null;
  tags?: Array<{ id: string; label: string }>;
};

const allColumns = [
  "orderId",
  "ticker",
  "side",
  "action",
  "status",
  "yesPrice",
  "noPrice",
  "initialCount",
  "remainingCount",
  "fillCount",
  "updatedTime",
  "tags",
] as const;

type ColumnKey = (typeof allColumns)[number];

export const TradesTable = (props: {
  rows: TradeRow[];
  maybeSavedViews: Array<{ id: string; viewName: string; stateJson: string }> | undefined;
  onSaveView: (input: { viewName: string; stateJson: string }) => void;
  onBulkTag: (orderIds: string[], tagId: string) => void;
  onExportCsv: () => void;
}) => {
  const [visibleColumns, setVisibleColumns] = createSignal<ColumnKey[]>([...allColumns]);
  const [quickSearch, setQuickSearch] = createSignal("");
  const [quickStatus, setQuickStatus] = createSignal<"all" | "resting" | "canceled" | "executed">(
    "all",
  );
  const [maybeTagIdForBulk, setMaybeTagIdForBulk] = createSignal("");
  const [selectedIds, setSelectedIds] = createSignal<string[]>([]);
  const [viewNameDraft, setViewNameDraft] = createSignal("");

  const filteredRows = createMemo(() => {
    const search = quickSearch().trim().toLowerCase();
    return props.rows.filter((row) => {
      if (quickStatus() !== "all" && row.status !== quickStatus()) {
        return false;
      }
      if (search.length === 0) {
        return true;
      }

      return (
        row.orderId.toLowerCase().includes(search) ||
        row.ticker.toLowerCase().includes(search) ||
        row.side.toLowerCase().includes(search) ||
        row.action.toLowerCase().includes(search)
      );
    });
  });

  const toggleSelection = (orderId: string) => {
    const current = selectedIds();
    if (current.includes(orderId)) {
      setSelectedIds(current.filter((id) => id !== orderId));
      return;
    }

    setSelectedIds([...current, orderId]);
  };

  const applySavedView = (stateJson: string) => {
    try {
      const parsed = JSON.parse(stateJson) as {
        visibleColumns?: ColumnKey[];
        quickStatus?: "all" | "resting" | "canceled" | "executed";
      };
      setVisibleColumns(parsed.visibleColumns ?? [...allColumns]);
      setQuickStatus(parsed.quickStatus ?? "all");
    } catch {
      setVisibleColumns([...allColumns]);
      setQuickStatus("all");
    }
  };

  const saveCurrentView = () => {
    props.onSaveView({
      viewName: viewNameDraft().trim(),
      stateJson: JSON.stringify({
        visibleColumns: visibleColumns(),
        quickStatus: quickStatus(),
      }),
    });
    setViewNameDraft("");
  };

  return (
    <div class="space-y-3">
      <div class="grid gap-2 lg:grid-cols-[1fr_auto_auto_auto_auto]">
        <Input
          value={quickSearch()}
          onInput={(event) => {
            setQuickSearch(event.currentTarget.value);
          }}
          placeholder="Search order id, ticker, side, action..."
        />
        <select
          class="h-9 rounded-md border border-zinc-800 bg-zinc-900 px-2 text-sm text-zinc-100"
          value={quickStatus()}
          onChange={(event) => {
            setQuickStatus(
              event.currentTarget.value as "all" | "resting" | "canceled" | "executed",
            );
          }}
        >
          <option value="all">All statuses</option>
          <option value="resting">Resting</option>
          <option value="canceled">Canceled</option>
          <option value="executed">Executed</option>
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            props.onExportCsv();
          }}
        >
          Export CSV
        </Button>
        <Input
          value={maybeTagIdForBulk()}
          placeholder="Tag ID"
          onInput={(event) => {
            setMaybeTagIdForBulk(event.currentTarget.value);
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            props.onBulkTag(selectedIds(), maybeTagIdForBulk());
          }}
        >
          Bulk tag selected
        </Button>
      </div>

      <div class="rounded-md border border-zinc-800 p-2">
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">Column chooser</p>
        <div class="flex flex-wrap gap-2">
          <For each={allColumns}>
            {(column) => (
              <label class="inline-flex items-center gap-1 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={visibleColumns().includes(column)}
                  onChange={(event) => {
                    if (event.currentTarget.checked) {
                      setVisibleColumns([...visibleColumns(), column]);
                      return;
                    }

                    setVisibleColumns(visibleColumns().filter((item) => item !== column));
                  }}
                />
                {column}
              </label>
            )}
          </For>
        </div>
      </div>

      <div class="rounded-md border border-zinc-800 p-2">
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">Saved views</p>
        <div class="mb-2 flex flex-wrap gap-2">
          <For each={props.maybeSavedViews ?? []}>
            {(view) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  applySavedView(view.stateJson);
                }}
              >
                {view.viewName}
              </Button>
            )}
          </For>
        </div>
        <div class="grid gap-2 lg:grid-cols-[1fr_auto]">
          <Input
            value={viewNameDraft()}
            placeholder="New saved view name"
            onInput={(event) => {
              setViewNameDraft(event.currentTarget.value);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              saveCurrentView();
            }}
          >
            Save current view
          </Button>
        </div>
      </div>

      <div class="overflow-auto rounded-md border border-zinc-800">
        <table class="min-w-full border-collapse text-left text-xs">
          <thead class="bg-zinc-900 text-zinc-300">
            <tr>
              <th class="border-b border-zinc-800 px-2 py-2">Select</th>
              <Show when={visibleColumns().includes("orderId")}>
                <th class="border-b border-zinc-800 px-2 py-2">Order ID</th>
              </Show>
              <Show when={visibleColumns().includes("ticker")}>
                <th class="border-b border-zinc-800 px-2 py-2">Ticker</th>
              </Show>
              <Show when={visibleColumns().includes("side")}>
                <th class="border-b border-zinc-800 px-2 py-2">Side</th>
              </Show>
              <Show when={visibleColumns().includes("action")}>
                <th class="border-b border-zinc-800 px-2 py-2">Action</th>
              </Show>
              <Show when={visibleColumns().includes("status")}>
                <th class="border-b border-zinc-800 px-2 py-2">Status</th>
              </Show>
              <Show when={visibleColumns().includes("yesPrice")}>
                <th class="border-b border-zinc-800 px-2 py-2">Yes Price</th>
              </Show>
              <Show when={visibleColumns().includes("noPrice")}>
                <th class="border-b border-zinc-800 px-2 py-2">No Price</th>
              </Show>
              <Show when={visibleColumns().includes("initialCount")}>
                <th class="border-b border-zinc-800 px-2 py-2">Initial</th>
              </Show>
              <Show when={visibleColumns().includes("remainingCount")}>
                <th class="border-b border-zinc-800 px-2 py-2">Remaining</th>
              </Show>
              <Show when={visibleColumns().includes("fillCount")}>
                <th class="border-b border-zinc-800 px-2 py-2">Filled</th>
              </Show>
              <Show when={visibleColumns().includes("updatedTime")}>
                <th class="border-b border-zinc-800 px-2 py-2">Updated</th>
              </Show>
              <Show when={visibleColumns().includes("tags")}>
                <th class="border-b border-zinc-800 px-2 py-2">Tag Chips</th>
              </Show>
            </tr>
          </thead>
          <tbody>
            <For each={filteredRows()}>
              {(row) => (
                <tr class="border-b border-zinc-800/60">
                  <td class="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds().includes(row.orderId)}
                      onChange={() => {
                        toggleSelection(row.orderId);
                      }}
                    />
                  </td>
                  <Show when={visibleColumns().includes("orderId")}>
                    <td class="px-2 py-2">{row.orderId}</td>
                  </Show>
                  <Show when={visibleColumns().includes("ticker")}>
                    <td class="px-2 py-2">{row.ticker}</td>
                  </Show>
                  <Show when={visibleColumns().includes("side")}>
                    <td class="px-2 py-2">
                      <Badge>{row.side}</Badge>
                    </td>
                  </Show>
                  <Show when={visibleColumns().includes("action")}>
                    <td class="px-2 py-2">{row.action}</td>
                  </Show>
                  <Show when={visibleColumns().includes("status")}>
                    <td class="px-2 py-2">{row.status}</td>
                  </Show>
                  <Show when={visibleColumns().includes("yesPrice")}>
                    <td class="px-2 py-2">{row.yesPrice ?? "-"}</td>
                  </Show>
                  <Show when={visibleColumns().includes("noPrice")}>
                    <td class="px-2 py-2">{row.noPrice ?? "-"}</td>
                  </Show>
                  <Show when={visibleColumns().includes("initialCount")}>
                    <td class="px-2 py-2">{row.initialCount ?? "-"}</td>
                  </Show>
                  <Show when={visibleColumns().includes("remainingCount")}>
                    <td class="px-2 py-2">{row.remainingCount ?? "-"}</td>
                  </Show>
                  <Show when={visibleColumns().includes("fillCount")}>
                    <td class="px-2 py-2">{row.fillCount ?? "-"}</td>
                  </Show>
                  <Show when={visibleColumns().includes("updatedTime")}>
                    <td class="px-2 py-2">{row.updatedTime ?? "-"}</td>
                  </Show>
                  <Show when={visibleColumns().includes("tags")}>
                    <td class="px-2 py-2">
                      <div class="flex flex-wrap gap-1">
                        <For each={row.tags ?? []}>{(tag) => <Badge>{tag.label}</Badge>}</For>
                      </div>
                    </td>
                  </Show>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </div>
  );
};
