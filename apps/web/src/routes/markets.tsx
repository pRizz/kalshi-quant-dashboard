import { For, createResource, createSignal, onMount } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { postJson } from "~/lib/http-client";

export default function MarketsPage() {
  const [search, setSearch] = createSignal("");
  const [isClientReady, setIsClientReady] = createSignal(false);
  onMount(() => {
    setIsClientReady(true);
  });
  const [state, { refetch }] = createResource(
    () => ({
      ready: isClientReady(),
      query: search(),
    }),
    async (source) => {
      if (!source.ready) {
        return undefined;
      }

      const response = await fetch(`/api/markets?search=${encodeURIComponent(source.query)}`);
      return (await response.json()) as {
        markets: Array<{
          ticker: string;
          title: string | null;
          status: string | null;
          lastPriceDollars: string | null;
        }>;
        events: Array<{ eventTicker: string; title: string }>;
      };
    },
  );

  const refreshFromKalshi = async () => {
    await postJson("/api/sync/public", {
      environment: "production",
    });
    await refetch();
  };

  const annotateMarket = async (ticker: string) => {
    await postJson("/api/annotations", {
      kind: "create_annotation",
      targetType: "market",
      targetId: ticker,
      title: `Market note: ${ticker}`,
      contentMarkdown: "Quick note from Market Explorer.",
    });
  };

  return (
    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Market Explorer</CardTitle>
          <CardDescription>
            Read-only market exploration works without secrets. Sync public market data as needed.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="grid gap-2 lg:grid-cols-[1fr_auto]">
            <Input
              value={search()}
              placeholder="Search market ticker/title..."
              onInput={(event) => {
                setSearch(event.currentTarget.value);
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                void refreshFromKalshi();
              }}
            >
              Refresh from Kalshi
            </Button>
          </div>
          <div class="overflow-auto rounded-md border border-zinc-800">
            <table class="min-w-full text-left text-xs">
              <thead class="bg-zinc-900 text-zinc-300">
                <tr>
                  <th class="px-2 py-2">Ticker</th>
                  <th class="px-2 py-2">Title</th>
                  <th class="px-2 py-2">Status</th>
                  <th class="px-2 py-2">Last Price ($)</th>
                  <th class="px-2 py-2">Annotate</th>
                </tr>
              </thead>
              <tbody>
                <For each={state()?.markets ?? []}>
                  {(market) => (
                    <tr class="border-t border-zinc-800">
                      <td class="px-2 py-2">{market.ticker}</td>
                      <td class="px-2 py-2">{market.title ?? "-"}</td>
                      <td class="px-2 py-2">{market.status ?? "-"}</td>
                      <td class="px-2 py-2">{market.lastPriceDollars ?? "-"}</td>
                      <td class="px-2 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            void annotateMarket(market.ticker);
                          }}
                        >
                          Add note
                        </Button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
