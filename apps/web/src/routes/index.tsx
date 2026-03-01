import { A } from "@solidjs/router";
import { For, createResource, createSignal, onMount } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { postJson } from "~/lib/http-client";

export default function Home() {
  const [isClientReady, setIsClientReady] = createSignal(false);
  onMount(() => {
    setIsClientReady(true);
  });
  const [state, { refetch }] = createResource(isClientReady, async (ready) => {
    if (!ready) {
      return undefined;
    }

    const response = await fetch("/api/state");
    return (await response.json()) as {
      mode: {
        kind: "read_only" | "onboarding_in_progress" | "trading_enabled";
        environment: "production" | "demo";
      };
      totals: {
        orders: number;
        annotations: number;
        analyticsRuns: number;
      };
      recentActivity: Array<{
        id: string;
        actionType: string;
        summary: string;
        createdAt: string;
      }>;
    };
  });

  const syncPublic = async () => {
    await postJson("/api/sync/public", {
      environment: state()?.mode.environment ?? "production",
    });
    await refetch();
  };

  const syncPrivate = async () => {
    await postJson("/api/sync/private");
    await refetch();
  };

  return (
    <div class="grid gap-4 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle>Kalshi Trading Quant Dashboard</CardTitle>
          <CardDescription>
            Default launch mode is Production + Read-Only. Start Trading onboarding is required
            before private account calls.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3 text-sm text-zinc-300">
          <p>
            Current mode: <strong>{state()?.mode.kind ?? "read_only"}</strong> on{" "}
            <strong>{state()?.mode.environment ?? "production"}</strong>.
          </p>
          <div class="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                void syncPublic();
              }}
            >
              Sync public markets/events
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void syncPrivate();
              }}
            >
              Sync private portfolio
            </Button>
            <A href="/settings">
              <Button variant="primary">Start Trading</Button>
            </A>
          </div>
          <p class="text-xs text-zinc-500">
            Private calls remain blocked until onboarding validates credentials.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Local mirror totals</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2 text-sm text-zinc-300">
          <p>Orders: {state()?.totals.orders ?? 0}</p>
          <p>Annotations: {state()?.totals.annotations ?? 0}</p>
          <p>Analytics runs: {state()?.totals.analyticsRuns ?? 0}</p>
        </CardContent>
      </Card>
      <Card class="lg:col-span-3">
        <CardHeader>
          <CardTitle>Quick navigation</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-wrap gap-2">
          <A href="/trades">
            <Button variant="ghost">Trades</Button>
          </A>
          <A href="/markets">
            <Button variant="ghost">Markets</Button>
          </A>
          <A href="/portfolio">
            <Button variant="ghost">Portfolio</Button>
          </A>
          <A href="/annotations">
            <Button variant="ghost">All Annotations</Button>
          </A>
          <A href="/analytics/monte-carlo">
            <Button variant="ghost">Monte Carlo</Button>
          </A>
          <A href="/analytics/calibration">
            <Button variant="ghost">Calibration / Brier</Button>
          </A>
        </CardContent>
      </Card>
      <Card class="lg:col-span-3">
        <CardHeader>
          <CardTitle>Historical actions & analyses</CardTitle>
          <CardDescription>
            Auditable local timeline of actions: syncs, annotations, orders, analytics runs,
            exports.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-2 text-xs text-zinc-300">
          <For each={state()?.recentActivity ?? []}>
            {(activity) => (
              <div class="rounded border border-zinc-800 bg-zinc-900 p-2">
                <p class="font-medium text-zinc-100">{activity.summary}</p>
                <p class="text-zinc-500">
                  {activity.actionType} · {activity.createdAt}
                </p>
              </div>
            )}
          </For>
        </CardContent>
      </Card>
    </div>
  );
}
