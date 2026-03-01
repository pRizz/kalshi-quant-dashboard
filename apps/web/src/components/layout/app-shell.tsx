import { useNavigate } from "@solidjs/router";
import {
  type ParentProps,
  createEffect,
  createResource,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { SideNav } from "./side-nav";
import { StatusStrip } from "./status-strip";
import { TopCommandBar } from "./top-command-bar";

type AppShellProps = ParentProps<{
  environment: "production" | "demo";
  mode: "read_only" | "onboarding_in_progress" | "trading_enabled";
}>;

export const AppShell = (props: AppShellProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = createSignal("");
  const [stateFetchVersion, setStateFetchVersion] = createSignal(0);
  const [stateResource] = createResource(stateFetchVersion, async (version) => {
    if (version === 0) {
      return undefined;
    }

    const response = await fetch("/api/state");
    return (await response.json()) as {
      mode: {
        kind: "read_only" | "onboarding_in_progress" | "trading_enabled";
        environment: "production" | "demo";
      };
    };
  });

  const onNewAnnotationShortcut = () => navigate("/annotations?compose=1");
  const onOrderTicketShortcut = () => navigate("/settings?openOrderTicket=1");
  let maybeSyncInterval: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    setStateFetchVersion(1);
    const onKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const maybeInputElement = document.getElementById("global-search");
        maybeInputElement?.focus();
      }

      if (event.key.toLowerCase() === "n" && !(event.ctrlKey || event.metaKey)) {
        onNewAnnotationShortcut();
      }

      if (event.key.toLowerCase() === "o" && !(event.ctrlKey || event.metaKey)) {
        onOrderTicketShortcut();
      }
    };

    window.addEventListener("keydown", onKeydown);
    onCleanup(() => {
      window.removeEventListener("keydown", onKeydown);
      if (maybeSyncInterval) {
        clearInterval(maybeSyncInterval);
      }
    });
  });

  createEffect(() => {
    if (maybeSyncInterval) {
      clearInterval(maybeSyncInterval);
      maybeSyncInterval = undefined;
    }

    if ((stateResource()?.mode.kind ?? props.mode) !== "trading_enabled") {
      return;
    }

    maybeSyncInterval = setInterval(() => {
      void fetch("/api/sync/private", {
        method: "POST",
      });
    }, 60_000);
  });

  return (
    <div class="grid h-screen grid-cols-[220px_1fr] grid-rows-[auto_1fr_auto] bg-zinc-950 text-zinc-100">
      <div class="row-span-3">
        <SideNav />
      </div>
      <TopCommandBar
        onSearchFocus={() => {
          const maybeInputElement = document.getElementById("global-search");
          maybeInputElement?.focus();
        }}
        onNewAnnotation={() => {
          onNewAnnotationShortcut();
        }}
        onOpenOrderTicket={() => {
          onOrderTicketShortcut();
        }}
      />
      <main class="overflow-auto p-4">
        <div class="mb-3 flex items-center gap-2">
          <input
            id="global-search"
            value={searchQuery()}
            onInput={(event) => {
              setSearchQuery(event.currentTarget.value);
            }}
            placeholder="Global search markets, orders, annotations..."
            class="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
          />
        </div>
        {props.children}
      </main>
      <StatusStrip
        environment={stateResource()?.mode.environment ?? props.environment}
        mode={stateResource()?.mode.kind ?? props.mode}
      />
    </div>
  );
};
