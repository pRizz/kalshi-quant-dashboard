import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const appRootDirectory = path.resolve(currentDirectory, "../../../..");
const appDataDirectory = path.join(appRootDirectory, "data");
mkdirSync(appDataDirectory, { recursive: true });
const databasePath = path.join(appDataDirectory, "kalshi-dashboard.sqlite");

const sqlite = new Database(databasePath);
sqlite.pragma("journal_mode = WAL");

const bootstrapSchema = () => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY,
      default_environment TEXT NOT NULL DEFAULT 'production',
      trading_mode TEXT NOT NULL DEFAULT 'read_only',
      onboarding_step TEXT,
      allow_local_secret_read INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS credential_refs (
      id TEXT PRIMARY KEY,
      environment TEXT NOT NULL,
      api_key_id TEXT NOT NULL,
      private_key_path TEXT NOT NULL,
      last_validated_at TEXT,
      validation_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS kalshi_orders (
      order_id TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      side TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      yes_price INTEGER,
      no_price INTEGER,
      initial_count INTEGER,
      remaining_count INTEGER,
      fill_count INTEGER,
      taker_fees INTEGER,
      maker_fees INTEGER,
      created_time TEXT,
      updated_time TEXT
    );
    CREATE TABLE IF NOT EXISTS kalshi_fills (
      fill_id TEXT PRIMARY KEY,
      trade_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      ticker TEXT NOT NULL,
      side TEXT NOT NULL,
      action TEXT NOT NULL,
      count INTEGER NOT NULL,
      count_fp TEXT NOT NULL,
      yes_price INTEGER,
      no_price INTEGER,
      created_time TEXT,
      ts INTEGER
    );
    CREATE TABLE IF NOT EXISTS kalshi_market_positions (
      ticker TEXT PRIMARY KEY,
      position INTEGER NOT NULL,
      position_fp TEXT NOT NULL,
      total_traded INTEGER NOT NULL,
      realized_pnl INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS kalshi_event_positions (
      event_ticker TEXT PRIMARY KEY,
      total_cost INTEGER NOT NULL,
      realized_pnl INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS kalshi_balance_snapshots (
      id TEXT PRIMARY KEY,
      balance INTEGER NOT NULL,
      portfolio_value INTEGER NOT NULL,
      updated_ts INTEGER NOT NULL,
      synced_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS kalshi_markets_cache (
      ticker TEXT PRIMARY KEY,
      event_ticker TEXT,
      title TEXT,
      status TEXT,
      last_price_dollars TEXT,
      yes_ask_dollars TEXT,
      yes_bid_dollars TEXT,
      volume_fp TEXT,
      raw_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS kalshi_events_cache (
      event_ticker TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      raw_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_checkpoints (
      id TEXT PRIMARY KEY,
      environment TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      cursor TEXT,
      cutoff_timestamp TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content_markdown TEXT NOT NULL,
      links_json TEXT NOT NULL DEFAULT '[]',
      custom_fields_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3b82f6',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS annotation_tags (
      id TEXT PRIMARY KEY,
      annotation_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS entity_tags (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS saved_table_views (
      id TEXT PRIMARY KEY,
      table_key TEXT NOT NULL,
      view_name TEXT NOT NULL,
      state_json TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS trade_journal_entries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body_markdown TEXT NOT NULL,
      maybe_order_id TEXT,
      maybe_fill_id TEXT,
      maybe_market_ticker TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS analytics_runs (
      id TEXT PRIMARY KEY,
      module_type TEXT NOT NULL,
      title TEXT NOT NULL,
      seed TEXT,
      input_json TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      action_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
  `);
};

bootstrapSchema();
export const db = drizzle(sqlite, { schema });

export const nowIso = (): string => new Date().toISOString();

export const ensureDefaultSettings = (): void => {
  const maybeSettingsRow = db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.id, 1))
    .get();
  if (maybeSettingsRow) {
    return;
  }

  db.insert(schema.appSettings)
    .values({
      id: 1,
      defaultEnvironment: "production",
      tradingMode: "read_only",
      onboardingStep: "disclaimer",
      allowLocalSecretRead: false,
      updatedAt: nowIso(),
    })
    .run();
};
