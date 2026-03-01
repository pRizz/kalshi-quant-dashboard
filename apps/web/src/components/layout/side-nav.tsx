import { A, useLocation } from "@solidjs/router";
import {
  BarChart3,
  BookMarked,
  CandlestickChart,
  Home,
  NotebookPen,
  Settings,
  WalletCards,
} from "lucide-solid";
import { For } from "solid-js";
import { cn } from "~/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trades", label: "Trades", icon: CandlestickChart },
  { href: "/markets", label: "Markets", icon: BookMarked },
  { href: "/portfolio", label: "Portfolio", icon: WalletCards },
  { href: "/annotations", label: "Annotations", icon: NotebookPen },
  { href: "/analytics/monte-carlo", label: "Monte Carlo", icon: BarChart3 },
  { href: "/analytics/calibration", label: "Calibration", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const SideNav = () => {
  const location = useLocation();

  return (
    <aside class="flex h-full flex-col border-r border-zinc-800 bg-zinc-950">
      <div class="border-b border-zinc-800 px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">Kalshi Quant</p>
      </div>
      <nav class="space-y-1 p-2">
        <For each={links}>
          {(link) => {
            const Icon = link.icon;
            return (
              <A
                href={link.href}
                class={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                  location.pathname === link.href && "bg-zinc-900 text-zinc-100",
                )}
              >
                <Icon size={15} />
                <span>{link.label}</span>
              </A>
            );
          }}
        </For>
      </nav>
    </aside>
  );
};
