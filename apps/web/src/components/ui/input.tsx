import type { JSX } from "solid-js";
import { cn } from "~/lib/utils";

export const Input = (props: JSX.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    class={cn(
      "h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50",
      props.class,
    )}
    {...props}
  />
);
