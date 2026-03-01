import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

export const StartTradingOnboarding = (props: {
  onComplete: (input: {
    environment: "production" | "demo";
    apiKeyId: string;
    privateKeyPath: string;
    allowLocalSecretRead: boolean;
  }) => Promise<{ ok: boolean; message?: string }>;
}) => {
  const [environment, setEnvironment] = createSignal<"production" | "demo">("production");
  const [allowLocalSecretRead, setAllowLocalSecretRead] = createSignal(false);
  const [apiKeyId, setApiKeyId] = createSignal("");
  const [privateKeyPath, setPrivateKeyPath] = createSignal("");
  const [maybeError, setMaybeError] = createSignal<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const submit = async () => {
    setMaybeError(undefined);
    setIsSubmitting(true);
    try {
      const result = await props.onComplete({
        environment: environment(),
        apiKeyId: apiKeyId().trim(),
        privateKeyPath: privateKeyPath().trim(),
        allowLocalSecretRead: allowLocalSecretRead(),
      });
      if (!result.ok) {
        setMaybeError(result.message ?? "Credential validation failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start Trading Onboarding</CardTitle>
        <CardDescription>
          Trading remains disabled until you explicitly enable local secret reading and validate
          credentials.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <label class="block text-xs text-zinc-300">
          Environment
          <select
            class="mt-1 h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-2"
            value={environment()}
            onChange={(event) => {
              setEnvironment(event.currentTarget.value as "production" | "demo");
            }}
          >
            <option value="production">Production</option>
            <option value="demo">Demo</option>
          </select>
        </label>
        <div class="text-xs text-zinc-300">
          <p class="mb-1">API key id</p>
          <Input
            value={apiKeyId()}
            placeholder="Kalshi API key id"
            onInput={(event) => {
              setApiKeyId(event.currentTarget.value);
            }}
          />
        </div>
        <div class="text-xs text-zinc-300">
          <p class="mb-1">Private key path (local filesystem)</p>
          <Input
            value={privateKeyPath()}
            placeholder="/path/to/private.key"
            onInput={(event) => {
              setPrivateKeyPath(event.currentTarget.value);
            }}
          />
        </div>
        <label class="flex items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={allowLocalSecretRead()}
            onChange={(event) => {
              setAllowLocalSecretRead(event.currentTarget.checked);
            }}
          />
          I explicitly allow local secret reading for authenticated Kalshi requests.
        </label>
        <p class="text-xs text-zinc-500">
          Private keys are not stored in the database. Only path references and non-secret
          identifiers are saved.
        </p>
        <p class="text-xs text-zinc-500">
          Local demo shortcut: use API key id starting with <code>mock_</code> and private key path{" "}
          <code>mock://demo</code> to enable mock trading without real credentials.
        </p>
        {maybeError() ? <p class="text-xs text-red-400">{maybeError()}</p> : null}
        <Button
          variant="primary"
          disabled={isSubmitting()}
          onClick={() => {
            void submit();
          }}
        >
          {isSubmitting() ? "Validating..." : "Validate credentials and enable trading"}
        </Button>
      </CardContent>
    </Card>
  );
};
