// @refresh reload
import { StartClient, mount } from "@solidjs/start/client";

const maybeRootElement = document.getElementById("app");
if (maybeRootElement) {
  mount(() => <StartClient />, maybeRootElement);
}
