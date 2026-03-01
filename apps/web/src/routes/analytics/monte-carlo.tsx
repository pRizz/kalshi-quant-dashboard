import { For, Show, createResource, createSignal, onMount } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { deleteJson, patchJson, postJson } from "~/lib/http-client";

type MonteCarloRun = {
  id: string;
  title: string;
  moduleType: "monte_carlo_binary" | "calibration_brier";
  seed: string | null;
  inputJson: string;
  resultJson: string;
  createdAt: string;
};

export default function MonteCarloPage() {
  const [title, setTitle] = createSignal("Binary payoff run");
  const [ticker, setTicker] = createSignal("");
  const [assumedProbability, setAssumedProbability] = createSignal(0.62);
  const [yesPriceCents, setYesPriceCents] = createSignal(62);
  const [payoutIfYesCents, setPayoutIfYesCents] = createSignal(100);
  const [trials, setTrials] = createSignal(50_000);
  const [seed, setSeed] = createSignal(42);
  const [confidenceLevel, setConfidenceLevel] = createSignal<0.9 | 0.95 | 0.99>(0.95);
  const [latestResultJson, setLatestResultJson] = createSignal<string>("");
  const [isClientReady, setIsClientReady] = createSignal(false);
  onMount(() => {
    setIsClientReady(true);
  });

  const [runs, { refetch }] = createResource(isClientReady, async (ready) => {
    if (!ready) {
      return undefined;
    }

    const response = await fetch("/api/analytics/runs");
    return (await response.json()) as {
      runs: MonteCarloRun[];
    };
  });

  const runSimulation = async () => {
    const result = await postJson<{ ok: boolean; runId: string; result: unknown }>(
      "/api/analytics/monte-carlo",
      {
        title: title(),
        assumedProbability: assumedProbability(),
        yesPriceCents: yesPriceCents(),
        payoutIfYesCents: payoutIfYesCents(),
        trials: trials(),
        seed: seed(),
        confidenceLevel: confidenceLevel(),
        maybeTicker: ticker(),
      },
    );
    setLatestResultJson(JSON.stringify(result.result, null, 2));
    await refetch();
  };

  const deleteRun = async (runId: string) => {
    await deleteJson(`/api/analytics/runs?id=${runId}`);
    await refetch();
  };

  const rerun = async (runId: string) => {
    await patchJson("/api/analytics/runs", {
      runId,
      patch: {
        seed: seed(),
      },
    });
    await refetch();
  };

  return (
    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Monte Carlo Playground (Binary Payoff)</CardTitle>
          <CardDescription>
            Seeded simulator with confidence intervals. Runs are persisted, listable, deletable, and
            reproducible.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="grid gap-2 lg:grid-cols-4">
            <Input
              value={title()}
              onInput={(event) => setTitle(event.currentTarget.value)}
              placeholder="Run title"
            />
            <Input
              value={ticker()}
              onInput={(event) => setTicker(event.currentTarget.value)}
              placeholder="Optional ticker"
            />
            <Input
              type="number"
              step={0.01}
              value={assumedProbability()}
              onInput={(event) => setAssumedProbability(Number(event.currentTarget.value))}
              placeholder="Assumed probability"
            />
            <Input
              type="number"
              value={trials()}
              onInput={(event) => setTrials(Number(event.currentTarget.value))}
              placeholder="Trials"
            />
          </div>
          <div class="grid gap-2 lg:grid-cols-4">
            <Input
              type="number"
              value={yesPriceCents()}
              onInput={(event) => setYesPriceCents(Number(event.currentTarget.value))}
              placeholder="YES price (cents)"
            />
            <Input
              type="number"
              value={payoutIfYesCents()}
              onInput={(event) => setPayoutIfYesCents(Number(event.currentTarget.value))}
              placeholder="Payout if YES (cents)"
            />
            <Input
              type="number"
              value={seed()}
              onInput={(event) => setSeed(Number(event.currentTarget.value))}
              placeholder="Random seed"
            />
            <select
              class="h-9 rounded border border-zinc-800 bg-zinc-900 px-2 text-sm"
              value={confidenceLevel()}
              onChange={(event) =>
                setConfidenceLevel(Number(event.currentTarget.value) as 0.9 | 0.95 | 0.99)
              }
            >
              <option value={0.9}>90% CI</option>
              <option value={0.95}>95% CI</option>
              <option value={0.99}>99% CI</option>
            </select>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              void runSimulation();
            }}
          >
            Run simulation
          </Button>
          <Show when={latestResultJson()}>
            <pre class="overflow-auto rounded border border-zinc-800 bg-zinc-900 p-3 text-xs">
              {latestResultJson()}
            </pre>
          </Show>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Monte Carlo runs</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <For each={(runs()?.runs ?? []).filter((run) => run.moduleType === "monte_carlo_binary")}>
            {(run) => (
              <div class="rounded border border-zinc-800 bg-zinc-900 p-3">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-zinc-100">{run.title}</p>
                    <p class="text-xs text-zinc-500">
                      Run ID: {run.id} · Seed: {run.seed ?? "n/a"}
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void rerun(run.id);
                      }}
                    >
                      Re-run with current seed
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        void deleteRun(run.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </CardContent>
      </Card>
    </div>
  );
}
