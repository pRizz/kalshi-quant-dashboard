import type { ParentProps } from "solid-js";
import { cn } from "~/lib/utils";

export const Card = (props: ParentProps<{ class?: string }>) => (
  <section
    class={cn(
      "rounded-lg border border-zinc-800 bg-zinc-950/70 text-zinc-100 shadow-sm backdrop-blur",
      props.class,
    )}
  >
    {props.children}
  </section>
);

export const CardHeader = (props: ParentProps<{ class?: string }>) => (
  <header class={cn("border-b border-zinc-800 p-4", props.class)}>{props.children}</header>
);

export const CardTitle = (props: ParentProps<{ class?: string }>) => (
  <h3 class={cn("text-sm font-semibold tracking-wide text-zinc-100", props.class)}>
    {props.children}
  </h3>
);

export const CardDescription = (props: ParentProps<{ class?: string }>) => (
  <p class={cn("mt-1 text-xs text-zinc-400", props.class)}>{props.children}</p>
);

export const CardContent = (props: ParentProps<{ class?: string }>) => (
  <div class={cn("p-4", props.class)}>{props.children}</div>
);

export const CardFooter = (props: ParentProps<{ class?: string }>) => (
  <footer class={cn("border-t border-zinc-800 p-4", props.class)}>{props.children}</footer>
);
