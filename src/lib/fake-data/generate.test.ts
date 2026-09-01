import { describe, expect, it } from "vitest";
import { generateRows, nestRows, defaultFields, FIELD_TYPES } from "@/lib/fake-data/generate";

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

  it("alphanumUpper emits only uppercase letters and digits", () => {
    const rows = generateRows([{ name: "code", type: "alphanumUpper" }], 3, "s");
    for (const row of rows) {
      expect(String(row.code)).toMatch(/^[A-Z0-9]+$/);
      expect(String(row.code)).toMatch(/[A-Z]/);
    }
  });

  it("alphanumLower emits only lowercase letters and digits", () => {
    const rows = generateRows([{ name: "code", type: "alphanumLower" }], 3, "s");
    for (const row of rows) {
      expect(String(row.code)).toMatch(/^[a-z0-9]+$/);
      expect(String(row.code)).toMatch(/[a-z]/);
    }
  });

  it("reuses the sample value for keepSample fields", () => {
    const rows = generateRows(
      [
        { name: "price", type: "number", keepSample: true, sampleValue: 45.99 },
        { name: "qty", type: "number" },
      ],
      3,
      "x",
    );
    for (const row of rows) {
      expect(row.price).toBe(45.99);
    }
  });
});

describe("nestRows", () => {
  it("rebuilds nested objects and arrays of objects into the input shape", () => {
    const fields = [
      { name: "id", type: "number" as const },
      { name: "profile.firstName", type: "firstName" as const, path: [{ key: "profile" }, { key: "firstName" }] },
      { name: "orders.orderId", type: "words" as const, path: [{ key: "orders", array: true }, { key: "orderId" }] },
      { name: "orders.amount", type: "number" as const, path: [{ key: "orders", array: true }, { key: "amount" }] },
    ];
    const flat: Record<string, string | number | boolean>[] = [
      { id: 1, "profile.firstName": "John", "orders.orderId": "A948", "orders.amount": 45.99 },
    ];
    const nested = nestRows(fields, flat);
    expect(nested).toHaveLength(1);
    expect(nested[0]).toEqual({
      id: 1,
      profile: { firstName: "John" },
      orders: [{ orderId: "A948", amount: 45.99 }],
    });
  });

  it("keeps flat fields flat and preserves top-level leaf columns", () => {
    const fields = [{ name: "name", type: "fullName" as const }];
    const nested = nestRows(fields, [{ name: "Ada Lovelace" }]);
    expect(nested[0]).toEqual({ name: "Ada Lovelace" });
  });
});