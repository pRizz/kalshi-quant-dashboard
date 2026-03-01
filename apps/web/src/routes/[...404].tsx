import { A } from "@solidjs/router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default function NotFound() {
  return (
    <div class="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Not Found</CardTitle>
          <CardDescription>The requested page does not exist.</CardDescription>
        </CardHeader>
        <CardContent>
          <A href="/">
            <Button variant="primary">Back to dashboard</Button>
          </A>
        </CardContent>
      </Card>
    </div>
  );
}
