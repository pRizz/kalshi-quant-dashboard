import { Search } from "lucide-solid";
import { Button } from "~/components/ui/button";

export const TopCommandBar = (props: {
  onSearchFocus: () => void;
  onNewAnnotation: () => void;
  onOpenOrderTicket: () => void;
}) => (
  <div class="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 py-2">
    <div class="flex items-center gap-2 text-xs text-zinc-400">
      <Search size={14} />
      <button
        type="button"
        class="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 hover:bg-zinc-800"
        onClick={() => {
          props.onSearchFocus();
        }}
      >
        Search (⌘/Ctrl + K)
      </button>
    </div>
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          props.onNewAnnotation();
        }}
      >
        New Annotation (N)
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          props.onOpenOrderTicket();
        }}
      >
        Order Ticket (O)
      </Button>
    </div>
  </div>
);
