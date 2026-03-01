import type { ParentProps } from "solid-js";
import { cn } from "~/lib/utils";

export const Badge = (props: ParentProps<{ class?: string }>) => (
  <span
    class={cn(
      "inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300",
      props.class,
    )}
  >
    {props.children}
  </span>
);
