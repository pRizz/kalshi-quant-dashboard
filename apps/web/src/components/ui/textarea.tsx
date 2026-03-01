import type { JSX } from "solid-js";
import { cn } from "~/lib/utils";

export const Textarea = (props: JSX.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    class={cn(
      "min-h-[120px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50",
      props.class,
    )}
    {...props}
  />
);
