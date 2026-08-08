import { describe, expect, it } from "vitest";
import { autoTransform } from "@/lib/processing/autoTransform";

describe("autoTransform", () => {
  it("keeps empty input with a waiting message", () => {
    const result = autoTransform("");
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("NONE");
    expect(result.message).toBe("Waiting for input.");
    expect(result.output).toBe("");
  });

  it("treats whitespace-only input as empty", () => {
    expect(autoTransform("   \n\t ").transformation).toBe("NONE");
  });

  it("pretty-prints valid JSON objects", () => {
    const input = '{"name":"John","age":30}';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_FORMAT");
    expect(result.detectedType).toBe("JSON");
    expect(result.output).toBe('{\n  "name": "John",\n  "age": 30\n}');
    expect(result.message).toBe("JSON detected and pretty-printed");
  });

  it("pretty-prints nested JSON and arrays", () => {
    const input = '{"user":{"name":"John","roles":["admin","user"]}}';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.output).toBe(
      '{\n  "user": {\n    "name": "John",\n    "roles": [\n      "admin",\n      "user"\n    ]\n  }\n}',
    );
  });

  it("pretty-prints JSON with unicode values", () => {
    const input = '{"message":"नमस्ते"}';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.output).toBe('{\n  "message": "नमस्ते"\n}');
  });

  it("decodes Base64 that contains plain text", () => {
    const result = autoTransform("SGVsbG8gV29ybGQ=");
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("BASE64_DECODE");
    expect(result.detectedType).toBe("TEXT");
    expect(result.output).toBe("Hello World");
    expect(result.message).toBe("Base64 decoded to plain text");
  });

  it("decodes Base64 and pretty-prints embedded JSON", () => {
    const result = autoTransform("eyJuYW1lIjoiSm9obiIsImFnZSI6MzB9");
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("BASE64_TO_JSON");
    expect(result.detectedType).toBe("JSON");
    expect(result.output).toBe('{\n  "name": "John",\n  "age": 30\n}');
    expect(result.message).toBe("Base64 decoded and JSON pretty-printed");
  });

  it("decodes unpadded Base64", () => {
    const result = autoTransform("eyJuYW1lIjoiSm9obiJ9");
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("BASE64_TO_JSON");
    expect(result.output).toBe('{\n  "name": "John"\n}');
  });

  it("leaves unknown input untouched with an error message", () => {
    const input = "hello world";
    const result = autoTransform(input);
    expect(result.success).toBe(false);
    expect(result.output).toBe(input);
    expect(result.originalInput).toBe(input);
    expect(result.message).toContain("Unable to automatically detect");
  });

  it("is idempotent on JSON output — reformatting its own output stays JSON", () => {
    const once = autoTransform('{"a":1}');
    const twice = autoTransform(once.output);
    expect(twice.success).toBe(true);
    expect(twice.transformation).toBe("JSON_FORMAT");
    expect(twice.output).toBe(once.output);
  });
});