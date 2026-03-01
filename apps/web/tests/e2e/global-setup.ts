import { rmSync } from "node:fs";
import path from "node:path";
import type { FullConfig } from "@playwright/test";

const globalSetup = async (_config: FullConfig) => {
  const databasePath = path.join(process.cwd(), "apps", "web", "data", "kalshi-dashboard.sqlite");
  const walPath = `${databasePath}-wal`;
  const shmPath = `${databasePath}-shm`;

  for (const filePath of [databasePath, walPath, shmPath]) {
    try {
      rmSync(filePath);
    } catch {
      // No-op when missing.
    }
  }
};

export default globalSetup;
