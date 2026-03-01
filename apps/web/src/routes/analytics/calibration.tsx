import { For, Show, createResource, createSignal, onMount } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { postJson } from "~/lib/http-client";

type CalibrationRun = {
  id: string;
  moduleType: "monte_carlo_binary" | "calibration_brier";
  title: string;
  resultJson: string;
  createdAt: string;
};

const parseCsvNumberList = (value: string): number[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => Number(item));

export default function CalibrationPage() {
  const [title, setTitle] = createSignal("Calibration run");
  const [predictions, setPredictions] = createSignal("0.7,0.3,0.9,0.1");
  const [outcomes, setOutcomes] = createSignal("1,0,1,0");
  const [bucketCount, setBucketCount] = createSignal(10);
  const [historyLimit, setHistoryLimit] = createSignal(200);
  const [latestResultJson, setLatestResultJson] = createSignal("");
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
      runs: CalibrationRun[];
    };
  });

  const runCalibration = async () => {
    const result = await postJson<{ ok: boolean; result: unknown }>("/api/analytics/calibration", {
      title: title(),
      predictions: parseCsvNumberList(predictions()),
      outcomes: parseCsvNumberList(outcomes()),
      maybeBucketCount: bucketCount(),
    });
    setLatestResultJson(JSON.stringify(result.result, null, 2));
    await refetch();
  };

  const loadMirroredDataset = async () => {
    const response = await fetch(`/api/analytics/calibration-dataset?limit=${historyLimit()}`);
    const payload = (await response.json()) as {
      predictions: number[];
      outcomes: number[];
      sampleSize: number;
    };
    setPredictions(payload.predictions.join(","));
    setOutcomes(payload.outcomes.join(","));
  };

  return (
    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Calibration Dashboard (Brier Score)</CardTitle>
          <CardDescription>
            Compare prediction calibration with Brier score and bucket breakdowns. Persist runs over
            time.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <Input
            value={title()}
            onInput={(event) => setTitle(event.currentTarget.value)}
            placeholder="Run title"
          />
          <Input
            value={predictions()}
            onInput={(event) => setPredictions(event.currentTarget.value)}
            placeholder="Predictions CSV"
          />
          <Input
            value={outcomes()}
            onInput={(event) => setOutcomes(event.currentTarget.value)}
            placeholder="Outcomes CSV (0/1)"
          />
          <Input
            type="number"
            value={bucketCount()}
            onInput={(event) => setBucketCount(Number(event.currentTarget.value))}
            placeholder="Bucket count"
          />
          <Input
            type="number"
            value={historyLimit()}
            onInput={(event) => setHistoryLimit(Number(event.currentTarget.value))}
            placeholder="History window (last N fills)"
          />
          <Button
            variant="outline"
            onClick={() => {
              void loadMirroredDataset();
            }}
          >
            Load dataset from mirrored history
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              void runCalibration();
            }}
          >
            Run calibration
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
          <CardTitle>Saved calibration runs</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <For each={(runs()?.runs ?? []).filter((run) => run.moduleType === "calibration_brier")}>
            {(run) => (
              <div class="rounded border border-zinc-800 bg-zinc-900 p-3">
                <p class="text-sm font-medium text-zinc-100">{run.title}</p>
                <p class="text-xs text-zinc-500">Run ID: {run.id}</p>
              </div>
            )}
          </For>
        </CardContent>
      </Card>
    </div>
  );
}
