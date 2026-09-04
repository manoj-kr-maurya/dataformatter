import { describe, expect, it } from "vitest";
import {
  decodeJsonBase64Recursive,
  jsonHasDecodableBase64,
} from "@/lib/processing/decodeJsonBase64";

describe("decodeJsonBase64Recursive", () => {
  it("decodes a base64 JSON string value into a nested object", () => {
    const result = decodeJsonBase64Recursive({ payload: "eyJmb28iOiJiYXIifQ==" });
    expect(result.changed).toBe(true);
    expect(result.value).toEqual({ payload: { foo: "bar" } });
  });

  it("recurses into arrays", () => {
    const result = decodeJsonBase64Recursive(["eyJhIjoxfQ=="]);
    expect(result.changed).toBe(true);
    expect(result.value).toEqual([{ a: 1 }]);
  });

  it("recurses into nested objects", () => {
    const result = decodeJsonBase64Recursive({ a: { b: "eyJjIjoyfQ==" } });
    expect(result.changed).toBe(true);
    expect(result.value).toEqual({ a: { b: { c: 2 } } });
  });

  it("decodes plain-text base64 to a string value", () => {
    const result = decodeJsonBase64Recursive({ greeting: "SGVsbG8gV29ybGQ=" });
    expect(result.changed).toBe(true);
    expect(result.value).toEqual({ greeting: "Hello World" });
  });

  it("leaves non-base64 strings unchanged", () => {
    const input = { msg: "Hello World", n: 42, flag: true, list: [1, "hi"] };
    const result = decodeJsonBase64Recursive(input);
    expect(result.changed).toBe(false);
    expect(result.value).toEqual(input);
  });

  it("decodes a JWT value into { header, payload, signature }", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const result = decodeJsonBase64Recursive({ token: jwt });
    expect(result.changed).toBe(true);
    expect(result.value).toEqual({
      token: {
        header: { alg: "HS256", typ: "JWT" },
        payload: { sub: "1234567890", name: "John Doe", iat: 1516239022 },
        signature: "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      },
    });
  });

  it("recurses into decoded JWT header/payload", () => {
    const header = btoa(JSON.stringify({ alg: "HS256", nested: btoa(JSON.stringify({ x: 1 })) })).replace(/=/g, "");
    const payload = btoa(JSON.stringify({ sub: "1" })).replace(/=/g, "");
    const sig = "sig";
    const result = decodeJsonBase64Recursive({ token: `${header}.${payload}.${sig}` });
    expect(result.changed).toBe(true);
    const token = (result.value as Record<string, unknown>).token as Record<string, unknown>;
    expect(token.header).toEqual({ alg: "HS256", nested: { x: 1 } });
    expect(token.payload).toEqual({ sub: "1" });
    expect(token.signature).toBe("sig");
  });
});

describe("jsonHasDecodableBase64", () => {
  it("finds a decodeable base64 string anywhere", () => {
    expect(jsonHasDecodableBase64({ a: { b: ["eyJ4IjoxfQ=="] } })).toBe(true);
  });

  it("finds a JWT string value", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    expect(jsonHasDecodableBase64({ token: jwt })).toBe(true);
  });

  it("returns false when nothing decodes", () => {
    expect(jsonHasDecodableBase64({ msg: "Hello World", n: 1 })).toBe(false);
  });
});
