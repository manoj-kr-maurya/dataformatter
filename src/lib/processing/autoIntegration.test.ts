import { describe, expect, it } from "vitest";
import { AUTO_DETECT, transform } from "@/lib/tools";

/** Browser-compatible base64 encoder. */
function b64(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
}

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

/**
 * Deep integration tests exercising the single dispatcher (transform) used by
 * both the home (Auto Detect) workspace and manual tools, confirming the
 * recursive/nested features compose correctly end-to-end.
 */
describe("home tool integration (transform/AUTO_DETECT)", () => {
  it("dispatches every auto branch through the single entry point", () => {
    expect(transform(AUTO_DETECT, true, '{"a":1}').transformation).toBe("JSON_FORMAT");
    expect(transform(AUTO_DETECT, true, b64('{"a":1}')).transformation).toBe("BASE64_TO_JSON");
    expect(transform(AUTO_DETECT, true, "SGVsbG8=").transformation).toBe("BASE64_DECODE");
    expect(transform(AUTO_DETECT, true, TOKEN).transformation).toBe("JWT_DECODE");
    expect(transform(AUTO_DETECT, true, '{"a":1} {"b":2}').transformation).toBe("JSON_TO_JSONL");
    expect(transform(AUTO_DETECT, true, '{"a":1} trailing').transformation).toBe("JSON_SALVAGE");
    expect(transform(AUTO_DETECT, true, "hello world").success).toBe(false);
  });

  it("honors the auto toggle: auto off returns input unchanged", () => {
    const result = transform(AUTO_DETECT, false, '{"a":1}');
    expect(result.success).toBe(false);
    expect(result.transformation).toBe("NONE");
    expect(result.output).toBe('{"a":1}');
    expect(result.message).toContain("Auto Detect is off");
  });

  it("waiting/empty input passes through both modes unchanged", () => {
    const on = transform(AUTO_DETECT, true, "");
    const off = transform(AUTO_DETECT, false, "");
    expect(on.transformation).toBe("NONE");
    expect(off.transformation).toBe("NONE");
  });

  it("decodes a JWT embedded inside a JSON value through the dispatcher", () => {
    const result = transform(AUTO_DETECT, true, JSON.stringify({ token: TOKEN }));
    expect(result.transformation).toBe("JSON_DECODE_BASE64");
    const parsed = JSON.parse(result.output);
    expect(parsed.token.payload.name).toBe("John Doe");
    expect(parsed.token.header.alg).toBe("HS256");
    expect(parsed.token.signature).toBeTruthy();
  });

  it("recursively unwraps nested base64 JSON through the dispatcher", () => {
    const result = transform(AUTO_DETECT, true, '{"user":{"roles":["eyJpZCI6MSwibmFtZSI6ImFkbWluIn0="]}}');
    expect(result.transformation).toBe("JSON_DECODE_BASE64");
    const parsed = JSON.parse(result.output);
    expect(parsed.user.roles).toEqual([{ id: 1, name: "admin" }]);
  });

  it("round-trips JSON decode output idempotently through the dispatcher", () => {
    const input = '{"payload": "eyJmb28iOiJiYXIifQ=="}';
    const once = transform(AUTO_DETECT, true, input);
    expect(once.transformation).toBe("JSON_DECODE_BASE64");
    const twice = transform(AUTO_DETECT, true, once.output);
    expect(twice.transformation).toBe("JSON_FORMAT");
    expect(twice.output).toBe(once.output);
  });

  it("round-trips JSONL multi-document output idempotently", () => {
    const once = transform(AUTO_DETECT, true, '{"a":1} {"b":2}');
    expect(once.transformation).toBe("JSON_TO_JSONL");
    const twice = transform(AUTO_DETECT, true, once.output);
    expect(twice.transformation).toBe("JSON_TO_JSONL");
    expect(twice.output).toBe(once.output);
  });

  it("base64-of-JSON pretty-prints without touching the outer encoding twice", () => {
    const result = transform(AUTO_DETECT, true, b64('{"name":"John","age":30}'));
    expect(result.transformation).toBe("BASE64_TO_JSON");
    expect(JSON.parse(result.output)).toEqual({ name: "John", age: 30 });
  });

  it("salvage labels ignored trailing content via the dispatcher", () => {
    const result = transform(AUTO_DETECT, true, "[1,2,3] garbage");
    expect(result.transformation).toBe("JSON_SALVAGE");
    expect(result.message).toContain("garbage");
    expect(JSON.parse(result.output)).toEqual([1, 2, 3]);
  });
});
