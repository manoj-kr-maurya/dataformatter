import { describe, expect, it } from "vitest";
import { detectInput } from "@/lib/detection/detectInput";
import { detectBase64 } from "@/lib/detection/detectBase64";

describe("detectInput priority", () => {
  it("detects valid JSON first", () => {
    const outcome = detectInput('{"name":"John"}');
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