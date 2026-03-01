import { type ParentProps, Show } from "solid-js";
import { cn } from "~/lib/utils";

export const Dialog = (
  props: ParentProps<{
    open: boolean;
    onClose: () => void;
    class?: string;
  }>,
) => (
  <Show when={props.open}>
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4">
      <div
        class={cn("w-full max-w-xl rounded-lg border border-zinc-800 bg-zinc-950 p-4", props.class)}
      >
        {props.children}
      </div>
      <button
        type="button"
        aria-label="Close dialog"
        class="absolute inset-0 -z-10 cursor-default"
        onClick={() => {
          props.onClose();
        }}
      />
    </div>
  </Show>
);
