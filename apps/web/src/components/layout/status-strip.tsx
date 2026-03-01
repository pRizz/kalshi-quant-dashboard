import { Badge } from "~/components/ui/badge";

export const StatusStrip = (props: {
  environment: "production" | "demo";
  mode: "read_only" | "onboarding_in_progress" | "trading_enabled";
}) => (
  <div class="flex items-center justify-between border-t border-zinc-800 bg-zinc-950 px-4 py-1 text-[11px] text-zinc-400">
    <div class="flex items-center gap-2">
      <Badge class="text-zinc-300">Environment: {props.environment}</Badge>
      <Badge
        class={
          props.mode === "trading_enabled"
            ? "border-emerald-700 bg-emerald-950 text-emerald-300"
            : "border-zinc-700 bg-zinc-900 text-zinc-300"
        }
      >
        Mode: {props.mode}
      </Badge>
    </div>
    <span>Local-only dashboard</span>
  </div>
);
