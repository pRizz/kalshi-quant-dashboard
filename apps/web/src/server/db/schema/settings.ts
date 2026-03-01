import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appSettings = sqliteTable("app_settings", {
  id: integer("id").primaryKey(),
  defaultEnvironment: text("default_environment", { enum: ["production", "demo"] })
    .notNull()
    .default("production"),
  tradingMode: text("trading_mode", {
    enum: ["read_only", "onboarding_in_progress", "trading_enabled"],
  })
    .notNull()
    .default("read_only"),
  onboardingStep: text("onboarding_step"),
  allowLocalSecretRead: integer("allow_local_secret_read", { mode: "boolean" })
    .notNull()
    .default(false),
  updatedAt: text("updated_at").notNull(),
});

export const credentialRefs = sqliteTable("credential_refs", {
  id: text("id").primaryKey(),
  environment: text("environment", { enum: ["production", "demo"] }).notNull(),
  apiKeyId: text("api_key_id").notNull(),
  privateKeyPath: text("private_key_path").notNull(),
  lastValidatedAt: text("last_validated_at"),
  validationError: text("validation_error"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
