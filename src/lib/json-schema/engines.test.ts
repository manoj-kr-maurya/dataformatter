import { describe, expect, it } from "vitest";
import { infer, inferAll, rootObject, ROOT_NAME } from "@/lib/json-schema/infer";
import { generateCode, CODE_GENERATORS } from "@/lib/json-schema/codegen";
import { generateSchema, SCHEMA_GENERATORS } from "@/lib/json-schema/schema-gen";

const parse = (text: string) => JSON.parse(text) as unknown;

describe("infer", () => {
  it("builds a root object and detects scalar types", () => {
    const node = infer(parse('{"name":"Ada","age":36,"active":true,"note":null}'));
    expect(node.kind).toBe("object");
    const fields = Object.fromEntries((node.props ?? []).map((p) => [p.name, p.node]));
    expect(fields.name?.scalar).toBe("string");
    expect(fields.age?.scalar).toBe("integer");
    expect(fields.active?.scalar).toBe("boolean");
    expect(fields.note?.scalar).toBe("null");
  });

  it("detects email/date/uuid string formats", () => {
    const node = infer(parse('{"e":"a@b.co","d":"2026-01-02T03:04:05Z","id":"123e4567-e89b-12d3-a456-426614174000"}'));
    const fields = Object.fromEntries((node.props ?? []).map((p) => [p.name, p.node]));
    expect(fields.e?.format).toBe("email");
    expect(fields.d?.format).toBe("date-time");
    expect(fields.id?.format).toBe("uuid");
  });

  it("merges array items by sampling", () => {
    const node = infer(parse('[{"a":1},{"a":2}]'));
    expect(node.kind).toBe("array");
    expect(node.items?.kind).toBe("object");
  });
});

describe("inferAll", () => {
  it("merges separate samples, marking absent fields optional", () => {
    const node = inferAll([parse('{"a":1}'), parse('{"a":2,"b":true}')]);
    const a = (node.props ?? []).find((p) => p.name === "a");
    const b = (node.props ?? []).find((p) => p.name === "b");
    expect(a?.optional).toBe(false);
    expect(b?.optional).toBe(true);
  });
});

describe("rootObject", () => {
  it("drills into a root array of objects", () => {
    const node = rootObject(infer(parse('[{"name":"x"}]')));
    expect((node.props ?? []).find((p) => p.name === "name")).toBeTruthy();
  });
  it("exposes ROOT_NAME", () => {
    expect(ROOT_NAME).toBe("Root");
  });
});

describe("CODE_GENERATORS", () => {
  const node = infer(parse('{"name":"Ada","age":36,"tags":["math"],"meta":{"dept":"cs"}}'));

  for (const gen of CODE_GENERATORS) {
    it(`${gen.id} generates non-empty ${gen.extension} code`, () => {
      const out = generateCode(gen.id, node);
      expect(out.length).toBeGreaterThan(20);
    });
  }
});

describe("SCHEMA_GENERATORS", () => {
  const node = infer(parse('{"name":"Ada","age":36}'));

  for (const gen of SCHEMA_GENERATORS) {
    it(`${gen.id} generates non-empty output`, () => {
      const out = generateSchema(gen.id, node);
      expect(out.length).toBeGreaterThan(20);
    });
  }

  it("zod output supports the generated field names", () => {
    const out = generateSchema("zod", node);
    expect(out).toContain("name");
    expect(out).toContain("age");
  });

  it("nestjs-dto output uses class-validator decorators", () => {
    const out = generateSchema("nestjs-dto", node);
    expect(out).toContain("@IsString");
    expect(out).toContain("readonly");
  });
});

describe("error paths", () => {
  it("throws on unknown generator ids", () => {
    expect(() => generateCode("nope", infer(parse("{}")))).toThrow();
    expect(() => generateSchema("nope", infer(parse("{}")))).toThrow();
  });
});