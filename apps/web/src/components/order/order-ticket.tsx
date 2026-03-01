import { Show, createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

export const OrderTicket = (props: {
  isTradingEnabled: boolean;
  onPlaceOrder: (input: {
    ticker: string;
    side: "yes" | "no";
    action: "buy" | "sell";
    count: number;
    maybeYesPrice?: number;
    maybeNoPrice?: number;
  }) => Promise<void>;
}) => {
  const [ticker, setTicker] = createSignal("");
  const [side, setSide] = createSignal<"yes" | "no">("yes");
  const [action, setAction] = createSignal<"buy" | "sell">("buy");
  const [count, setCount] = createSignal(1);
  const [yesPrice, setYesPrice] = createSignal(50);
  const [noPrice, setNoPrice] = createSignal(50);
  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const estimatedFees = () => Math.round(count() * 0.02 * 100) / 100;

  const submit = async () => {
    setIsSubmitting(true);
    try {
      await props.onPlaceOrder({
        ticker: ticker(),
        side: side(),
        action: action(),
        count: count(),
        maybeYesPrice: yesPrice(),
        maybeNoPrice: noPrice(),
      });
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Ticket</CardTitle>
        <CardDescription>
          Monetary actions require confirmation. Estimated fees shown before submission.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <Show
          when={props.isTradingEnabled}
          fallback={
            <p class="text-sm text-zinc-400">
              Trading is disabled. Complete Start Trading onboarding in settings first.
            </p>
          }
        >
          <Input
            value={ticker()}
            placeholder="Ticker (e.g. KXFED-YES)"
            onInput={(event) => setTicker(event.currentTarget.value)}
          />
          <div class="grid grid-cols-2 gap-2">
            <label class="text-xs text-zinc-300">
              Side
              <select
                class="mt-1 h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-2"
                value={side()}
                onChange={(event) => setSide(event.currentTarget.value as "yes" | "no")}
              >
                <option value="yes">YES</option>
                <option value="no">NO</option>
              </select>
            </label>
            <label class="text-xs text-zinc-300">
              Action
              <select
                class="mt-1 h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-2"
                value={action()}
                onChange={(event) => setAction(event.currentTarget.value as "buy" | "sell")}
              >
                <option value="buy">BUY</option>
                <option value="sell">SELL</option>
              </select>
            </label>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="text-xs text-zinc-300">
              <p class="mb-1">Contracts</p>
              <Input
                type="number"
                min={1}
                value={count()}
                onInput={(event) => setCount(Number(event.currentTarget.value))}
              />
            </div>
            <div class="text-xs text-zinc-300">
              <p class="mb-1">Yes price</p>
              <Input
                type="number"
                min={1}
                max={99}
                value={yesPrice()}
                onInput={(event) => setYesPrice(Number(event.currentTarget.value))}
              />
            </div>
            <div class="text-xs text-zinc-300">
              <p class="mb-1">No price</p>
              <Input
                type="number"
                min={1}
                max={99}
                value={noPrice()}
                onInput={(event) => setNoPrice(Number(event.currentTarget.value))}
              />
            </div>
          </div>
          <div class="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-300">
            <p>Summary</p>
            <p>
              {action().toUpperCase()} {side().toUpperCase()} {count()} contracts on{" "}
              {ticker() || "—"}
            </p>
            <p>
              Prices: YES {yesPrice()}¢ / NO {noPrice()}¢
            </p>
            <p>
              Estimated fees: ${estimatedFees().toFixed(2)} (may differ from exchange final fees)
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setIsConfirmOpen(true);
            }}
          >
            Review & Confirm
          </Button>
          <Dialog open={isConfirmOpen()} onClose={() => setIsConfirmOpen(false)}>
            <h3 class="text-sm font-semibold">Are you sure?</h3>
            <p class="mt-2 text-sm text-zinc-400">
              This can place a live order in {side().toUpperCase()} {action().toUpperCase()}{" "}
              direction.
            </p>
            <div class="mt-3 rounded border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-300">
              <p>Ticker: {ticker()}</p>
              <p>Action: {action()}</p>
              <p>Side: {side()}</p>
              <p>Contracts: {count()}</p>
              <p>YES price: {yesPrice()}¢</p>
              <p>NO price: {noPrice()}¢</p>
              <p>Estimated fees: ${estimatedFees().toFixed(2)}</p>
            </div>
            <div class="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isSubmitting()}
                onClick={() => {
                  void submit();
                }}
              >
                {isSubmitting() ? "Submitting..." : "Yes, place order"}
              </Button>
            </div>
          </Dialog>
        </Show>
      </CardContent>
    </Card>
  );
};
