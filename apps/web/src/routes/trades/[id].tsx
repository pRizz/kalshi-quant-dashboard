import { useParams } from "@solidjs/router";
import { createResource, createSignal, onMount } from "solid-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default function TradeDetailPage() {
  const params = useParams();
  const [isClientReady, setIsClientReady] = createSignal(false);
  onMount(() => {
    setIsClientReady(true);
  });
  const [detail] = createResource(isClientReady, async (ready) => {
    if (!ready) {
      return undefined;
    }

    const response = await fetch(`/api/orders?ticker=&search=${params.id}`);
    const payload = (await response.json()) as {
      orders: Array<Record<string, unknown>>;
    };
    return payload.orders.find((order) => order.orderId === params.id);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade detail: {params.id}</CardTitle>
        <CardDescription>
          Detailed local mirror row for one order id. Add annotations in the annotations page using
          target type = order.
        </CardDescription>
      </CardHeader>
      <CardContent class="text-sm text-zinc-300">
        <pre class="overflow-auto rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs">
          {JSON.stringify(detail(), null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}
