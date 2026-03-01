import { createEffect, createResource, createSignal, onMount } from "solid-js";
import { StartTradingOnboarding } from "~/components/onboarding/start-trading-onboarding";
import { OrderTicket } from "~/components/order/order-ticket";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { postJson } from "~/lib/http-client";

type SettingsState = {
  mode: {
    kind: "read_only" | "onboarding_in_progress" | "trading_enabled";
    environment: "production" | "demo";
  };
  secretReadPolicy: {
    kind: "enabled" | "disabled";
  };
};

export default function SettingsPage() {
  const [feedback, setFeedback] = createSignal("");
  const [environmentSelection, setEnvironmentSelection] = createSignal<"production" | "demo">(
    "production",
  );
  const [isClientReady, setIsClientReady] = createSignal(false);
  onMount(() => {
    setIsClientReady(true);
  });
  const [state, { refetch }] = createResource(isClientReady, async (ready) => {
    if (!ready) {
      return undefined;
    }

    const response = await fetch("/api/state");
    return (await response.json()) as SettingsState;
  });
  createEffect(() => {
    const maybeEnvironment = state()?.mode.environment;
    if (!maybeEnvironment) {
      return;
    }
    setEnvironmentSelection(maybeEnvironment);
  });

  const setReadOnly = async () => {
    await postJson("/api/settings/mode", {
      environment: state()?.mode.environment ?? "production",
      mode: "read_only",
    });
    await refetch();
  };

  const updateEnvironment = async () => {
    const currentMode = state()?.mode.kind ?? "read_only";
    await postJson("/api/settings/mode", {
      environment: environmentSelection(),
      mode: currentMode,
    });
    await refetch();
  };

  return (
    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mode & Environment</CardTitle>
          <CardDescription>
            Default is Production + Read-Only. Start Trading must be deliberate and validated.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3 text-sm text-zinc-300">
          <p>
            Current: <strong>{state()?.mode.kind}</strong> /{" "}
            <strong>{state()?.mode.environment}</strong>
          </p>
          <label class="block text-xs text-zinc-300">
            Environment
            <select
              class="mt-1 h-9 w-full rounded border border-zinc-800 bg-zinc-900 px-2"
              value={environmentSelection()}
              onChange={(event) => {
                setEnvironmentSelection(event.currentTarget.value as "production" | "demo");
              }}
            >
              <option value="production">Production</option>
              <option value="demo">Demo</option>
            </select>
          </label>
          <div class="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                void updateEnvironment();
              }}
            >
              Apply environment
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void setReadOnly();
              }}
            >
              Return to read-only
            </Button>
          </div>
        </CardContent>
      </Card>

      <StartTradingOnboarding
        onComplete={async (input) => {
          const result = await postJson<{ ok: boolean; message?: string }>(
            "/api/onboarding/complete",
            input,
          );
          await refetch();
          if (result.ok) {
            setFeedback("Trading enabled after successful credential validation.");
          } else {
            setFeedback(result.message ?? "Validation failed.");
          }
          return result;
        }}
      />
      {feedback() ? <p class="text-sm text-zinc-300">{feedback()}</p> : null}
      <OrderTicket
        isTradingEnabled={state()?.mode.kind === "trading_enabled"}
        onPlaceOrder={async (input) => {
          const result = await postJson<{ ok: boolean; message?: string }>("/api/orders", input);
          if (!result.ok) {
            setFeedback(result.message ?? "Unable to place order.");
            return;
          }
          setFeedback("Order submitted.");
          await refetch();
        }}
      />
    </div>
  );
}
