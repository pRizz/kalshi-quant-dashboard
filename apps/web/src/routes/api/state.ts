import { count, desc } from "drizzle-orm";
import { db } from "~/server/db/client";
import { activityLog, analyticsRuns, annotations, kalshiOrders } from "~/server/db/schema";
import { jsonResponse } from "~/server/http/json-response";
import { getSecretReadPolicy, getTradingMode } from "~/server/settings/settings-service";

export const GET = async () => {
  const mode = getTradingMode();
  const secretReadPolicy = getSecretReadPolicy(mode.environment);
  const totals = {
    orders: db.select({ value: count() }).from(kalshiOrders).get()?.value ?? 0,
    annotations: db.select({ value: count() }).from(annotations).get()?.value ?? 0,
    analyticsRuns: db.select({ value: count() }).from(analyticsRuns).get()?.value ?? 0,
  };
  const recentActivity = db
    .select()
    .from(activityLog)
    .orderBy(desc(activityLog.createdAt))
    .limit(10)
    .all();

  return jsonResponse({
    mode,
    secretReadPolicy,
    totals,
    recentActivity,
  });
};
