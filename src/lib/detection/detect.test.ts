import { describe, expect, it } from "vitest";
import { detectInput } from "@/lib/detection/detectInput";
import { detectBase64 } from "@/lib/detection/detectBase64";

describe("detectInput priority", () => {
  it("detects JWT tokens (checked after JSON and Base64)", () => {
    const outcome = detectInput(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    );
    expect(outcome.status).toBe("jwt");
    if (outcome.status === "jwt") {
      expect(outcome.value.header).toEqual({ alg: "HS256", typ: "JWT" });
    }
  });

  it("detects JWTs pasted with a Bearer authorization prefix", () => {
    const outcome = detectInput(
      "bearer eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.someSignatureHere",
    );
    expect(outcome.status).toBe("jwt");
  });

  it("detects JWTs embedded in arbitrary surrounding text like jwt.io", () => {
    const outcome = detectInput(
      "abcd eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.someSignatureHere please verify",
    );
    expect(outcome.status).toBe("jwt");
    if (outcome.status === "jwt") {
      expect(outcome.value.payload.name).toBe("John");
    }
  });

  it("does not treat 3-part junk or JSON as a JWT", () => {
    expect(detectInput("a.b.c").status).not.toBe("jwt");
    expect(detectInput('{"a":1}').status).toBe("json");
  });

  it("detects valid JSON first", () => {
    const outcome = detectInput('{"name":"John"}');
    expect(outcome.status).toBe("json");
  });

  it("treats JSON that merely contains a JWT as JSON, not JWT", () => {
    const outcome = detectInput(
      '{"access_token":"eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.someSignatureHere"}',
    );
    expect(outcome.status).toBe("json");
  });

  it("detects nested JSON, arrays and unicode primitives", () => {
    expect(detectInput('{"user":{"name":"John","roles":["admin","user"]}}').status).toBe("json");
    expect(detectInput('[{"id":1},{"id":2}]').status).toBe("json");
    expect(detectInput('{"message":"नमस्ते"}').status).toBe("json");
    expect(detectInput("42").status).toBe("json");
  });

  it("detects Base64 containing JSON", () => {
    const outcome = detectInput("eyJuYW1lIjoiSm9obiJ9");
    expect(outcome.status).toBe("base64");
    if (outcome.status === "base64") {
      expect(outcome.decoded).toBe('{"name":"John"}');
      expect(outcome.decodedIsJson).toBe(true);
    }
  });

  it("detects Base64 containing plain text", () => {
    const outcome = detectInput("SGVsbG8gV29ybGQ=");
    expect(outcome.status).toBe("base64");
    if (outcome.status === "base64") {
      expect(outcome.decoded).toBe("Hello World");
      expect(outcome.decodedIsJson).toBe(false);
    }
  });

  it("never treats arbitrary plain text as Base64", () => {
    for (const text of ["hello", "hello world", "randomstring", "opencode", "definitelynotbase64"]) {
      const outcome = detectInput(text);
      expect(outcome.status).toBe("unknown");
    }
  });

  it("returns empty for whitespace input", () => {
    expect(detectInput("   \n  ").status).toBe("empty");
  });
});

describe("detectBase64", () => {
  it("accepts padded, unpadded and whitespace base64", () => {
    expect(detectBase64("eyJmb28iOiJiYXIifQ==").ok).toBe(true);
    expect(detectBase64("eyJmb28iOiJiYXIifQ").ok).toBe(true);
    expect(detectBase64("aGVsbG8gd29ybGQ=").ok).toBe(true);
    expect(detectBase64("aGVsbG8g d29y\nbGQ=").ok).toBe(true);
    expect(detectBase64("aGVsbG8gd29ybGQ").ok).toBe(true);
  });

  it("rejects candidates shorter than 8 chars", () => {
    expect(detectBase64("SGVsbG8").ok).toBe(false);
  });

  it("rejects candidates that are not text after decoding", () => {
    expect(detectBase64("hello world").ok).toBe(false);
    expect(detectBase64("randomstring").ok).toBe(false);
    expect(detectBase64("opencode").ok).toBe(false);
  });
});