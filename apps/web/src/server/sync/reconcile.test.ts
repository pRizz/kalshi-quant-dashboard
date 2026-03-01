import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db, nowIso } from "../db/client";
import { annotations, kalshiOrders } from "../db/schema";
import { reconcileOrders } from "./reconcile";

describe("reconcileOrders", () => {
  it("upserts orders idempotently without duplicating rows", () => {
    // Arrange
    const order = {
      order_id: "order-1",
      ticker: "KXFED-YES",
      side: "yes" as const,
      action: "buy" as const,
      status: "resting" as const,
      yes_price: 55,
      no_price: 45,
      initial_count: 10,
      remaining_count: 10,
      fill_count: 0,
      taker_fees: 0,
      maker_fees: 0,
      created_time: nowIso(),
      last_update_time: nowIso(),
    };

    // Act
    reconcileOrders([order]);
    reconcileOrders([{ ...order, status: "canceled", remaining_count: 0 }]);

    // Assert
    const rows = db.select().from(kalshiOrders).where(eq(kalshiOrders.orderId, "order-1")).all();
    expect(rows.length).toBe(1);
    expect(rows[0]?.status).toBe("canceled");
  });

  it("does not clobber local annotations while syncing orders", () => {
    // Arrange
    const annotationId = `annotation-preserve-test-${Date.now()}`;
    db.insert(annotations)
      .values({
        id: annotationId,
        targetType: "order",
        targetId: "order-2",
        title: "Local note",
        contentMarkdown: "Do not remove me.",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      })
      .run();

    // Act
    reconcileOrders([
      {
        order_id: "order-2",
        ticker: "KXRATE-YES",
        side: "yes",
        action: "buy",
        status: "resting",
        yes_price: 62,
        no_price: 38,
        initial_count: 3,
        remaining_count: 3,
        fill_count: 0,
        taker_fees: 0,
        maker_fees: 0,
        created_time: nowIso(),
        last_update_time: nowIso(),
      },
    ]);

    // Assert
    const maybeAnnotation = db
      .select()
      .from(annotations)
      .where(eq(annotations.id, annotationId))
      .get();
    expect(maybeAnnotation?.title).toBe("Local note");
  });
});
