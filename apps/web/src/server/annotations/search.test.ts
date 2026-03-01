import { describe, expect, it } from "vitest";
import { createAnnotation, listAnnotations } from "./annotation-service";

describe("annotation search filtering", () => {
  it("returns only annotations matching text query", () => {
    // Arrange
    createAnnotation({
      targetType: "market",
      targetId: "KXABC-YES",
      title: "Fed note",
      contentMarkdown: "Expecting upward CPI pressure.",
    });
    createAnnotation({
      targetType: "market",
      targetId: "KXABC-NO",
      title: "Weather note",
      contentMarkdown: "Rain outlook update.",
    });

    // Act
    const rows = listAnnotations({ maybeSearch: "CPI" });

    // Assert
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.some((row) => row.contentMarkdown.includes("CPI"))).toBe(true);
  });
});
