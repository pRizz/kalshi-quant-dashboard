import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { AppShell } from "~/components/layout/app-shell";
import "./app.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <Suspense>
          <AppShell environment="production" mode="read_only">
            {props.children}
          </AppShell>
        </Suspense>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
