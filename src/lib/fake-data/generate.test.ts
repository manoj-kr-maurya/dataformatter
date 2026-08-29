import { describe, expect, it } from "vitest";
import { generateRows, defaultFields, FIELD_TYPES } from "@/lib/fake-data/generate";

describe("generateRows", () => {
  it("is seeded and deterministic", () => {
    const fields = defaultFields();
    const a = generateRows(fields, 5, "seed-1");
    const b = generateRows(fields, 5, "seed-1");
    expect(a).toEqual(b);
  });

  it("changes output for a different seed", () => {
    const fields = defaultFields();
    const a = generateRows(fields, 5, "seed-1");
    const b = generateRows(fields, 5, "seed-2");
    expect(a).not.toEqual(b);
  });

  it("emits the requested row count and column names", () => {
    const rows = generateRows([{ name: "id", type: "uuid" }, { name: "email", type: "email" }], 3, "x");
    expect(rows).toHaveLength(3);
    expect(Object.keys(rows[0]).sort()).toEqual(["email", "id"]);
  });

  it("supports every declared field type", () => {
    const rows = generateRows(
      FIELD_TYPES.map((type) => ({ name: type, type })),
      2,
      "all",
    );
    expect(rows).toHaveLength(2);
    for (const type of FIELD_TYPES) {
      expect(rows[0][type]).toBeDefined();
    }
  });
});