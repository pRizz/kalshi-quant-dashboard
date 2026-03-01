import { For, createResource, createSignal, onMount } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { postJson } from "~/lib/http-client";

export default function PortfolioPage() {
  const [isClientReady, setIsClientReady] = createSignal(false);
  onMount(() => {
    setIsClientReady(true);
  });
  const [portfolio, { refetch }] = createResource(isClientReady, async (ready) => {
    if (!ready) {
      return undefined;
    }

    const response = await fetch("/api/portfolio");
    return (await response.json()) as {
      maybeLatestBalance: {
        balance: number;
        portfolioValue: number;
      } | null;
      marketPositions: Array<{
        ticker: string;
        position: number;
        totalTraded: number;
        realizedPnl: number;
      }>;
      fills: Array<{
        fillId: string;
        ticker: string;
        side: string;
        action: string;
        count: number;
        yesPrice: number | null;
        noPrice: number | null;
      }>;
      balanceHistory: Array<{
        syncedAt: string;
        balance: number;
        portfolioValue: number;
      }>;
    };
  });

  const syncPortfolio = async () => {
    await postJson("/api/sync/private");
    await refetch();
  };

  return (
    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Mirror</CardTitle>
          <CardDescription>
            Local mirror of positions, fills, and balance snapshots sourced from Kalshi private
            endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <Button
            variant="outline"
            onClick={() => {
              void syncPortfolio();
            }}
          >
            Sync portfolio now
          </Button>
          <p class="text-sm text-zinc-300">
            Latest balance: {portfolio()?.maybeLatestBalance?.balance ?? 0} cents | Portfolio value:{" "}
            {portfolio()?.maybeLatestBalance?.portfolioValue ?? 0} cents
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Market positions</CardTitle>
        </CardHeader>
        <CardContent class="overflow-auto">
          <table class="min-w-full text-left text-xs">
            <thead class="bg-zinc-900 text-zinc-300">
              <tr>
                <th class="px-2 py-2">Ticker</th>
                <th class="px-2 py-2">Position</th>
                <th class="px-2 py-2">Total traded</th>
                <th class="px-2 py-2">Realized PnL</th>
              </tr>
            </thead>
            <tbody>
              <For each={portfolio()?.marketPositions ?? []}>
                {(row) => (
                  <tr class="border-t border-zinc-800">
                    <td class="px-2 py-2">{row.ticker}</td>
                    <td class="px-2 py-2">{row.position}</td>
                    <td class="px-2 py-2">{row.totalTraded}</td>
                    <td class="px-2 py-2">{row.realizedPnl}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent fills</CardTitle>
        </CardHeader>
        <CardContent class="overflow-auto">
          <table class="min-w-full text-left text-xs">
            <thead class="bg-zinc-900 text-zinc-300">
              <tr>
                <th class="px-2 py-2">Fill ID</th>
                <th class="px-2 py-2">Ticker</th>
                <th class="px-2 py-2">Side</th>
                <th class="px-2 py-2">Action</th>
                <th class="px-2 py-2">Count</th>
                <th class="px-2 py-2">YES/NO</th>
              </tr>
            </thead>
            <tbody>
              <For each={portfolio()?.fills ?? []}>
                {(fill) => (
                  <tr class="border-t border-zinc-800">
                    <td class="px-2 py-2">{fill.fillId}</td>
                    <td class="px-2 py-2">{fill.ticker}</td>
                    <td class="px-2 py-2">{fill.side}</td>
                    <td class="px-2 py-2">{fill.action}</td>
                    <td class="px-2 py-2">{fill.count}</td>
                    <td class="px-2 py-2">
                      {fill.yesPrice ?? "-"} / {fill.noPrice ?? "-"}
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
