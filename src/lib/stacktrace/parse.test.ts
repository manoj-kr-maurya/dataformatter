import { describe, expect, it } from "vitest";
import { parseStackTrace } from "@/lib/stacktrace/parse";

describe("parseStackTrace", () => {
  it("detects Java traces and extracts exception + frames", () => {
    const text = [
      "java.lang.NullPointerException: Cannot invoke \"String.length()\" because \"s\" is null",
      "    at com.acme.App.run(App.java:42)",
      "    at com.acme.Main.main(Main.java:12)",
    ].join("\n");
    const result = parseStackTrace(text);
    expect(result.language).toBe("java");
    expect(result.exceptionType).toContain("NullPointerException");
    expect(result.frames).toHaveLength(2);
    expect(result.location?.file).toContain("App.java");
    expect(result.location?.line).toBe(42);
    expect(result.chain[0]).toBe("run");
  });

  it("parses canonical tab-indented Java frames", () => {
    const text = [
      "java.lang.NullPointerException: Cannot invoke \"String.length()\" because \"name\" is null",
      "\tat com.example.OrderService.charge(OrderService.java:42)",
      "\tat com.example.OrdersController.create(OrdersController.java:18)",
      "\tat java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(...)",
    ].join("\n");
    const result = parseStackTrace(text);
    expect(result.language).toBe("java");
    expect(result.exceptionType).toContain("NullPointerException");
    expect(result.frames).toHaveLength(3);
    expect(result.frames[0].function).toBe("com.example.OrderService.charge");
    expect(result.frames[0].file).toBe("OrderService.java");
    expect(result.frames[0].line).toBe(42);
    expect(result.chain[0]).toBe("charge");
  });

  it("detects Node.js traces", () => {
    const text = [
      "  at fn (/app/fetcher.js:18:5)",
      "  at /app/index.js:3:9",
      "Error: ENOTFOUND api.example.com",
    ].join("\n");
    const result = parseStackTrace(text);
    expect(result.language).toBe("javascript");
    expect(result.message).toContain("ENOTFOUND");
    expect(result.frames[0].file).toContain("fetcher.js");
  });

  it("detects JS traces whose TypeError banner precedes the frames", () => {
    const text = [
      "TypeError: Cannot read properties of undefined (reading 'length')",
      "    at formatUser (webpack:///src/utils.ts:12:9)",
      "    at renderProfile (webpack:///src/Profile.tsx:33:15)",
    ].join("\n");
    const result = parseStackTrace(text);
    expect(result.language).toBe("javascript");
    expect(result.exceptionType).toBe("TypeError");
    expect(result.frames).toHaveLength(2);
    expect(result.frames[0].function).toBe("formatUser");
    expect(result.frames[0].file).toContain("utils.ts");
    expect(result.chain[0]).toBe("formatUser");
  });

  it("detects Python tracebacks", () => {
    const text = [
      "Traceback (most recent call last):",
      '  File "/app/main.py", line 4, in <module>',
      "ValueError: invalid literal",
    ].join("\n");
    const result = parseStackTrace(text);
    expect(result.language).toBe("python");
    expect(result.exceptionType).toBe("ValueError");
    expect(result.frames[0].file).toContain("main.py");
    expect(result.frames[0].line).toBe(4);
  });

  it("detects Go panics", () => {
    const text = [
      "goroutine 1 [running]:",
      "main.main()",
      "    /app/main.go:37 +0x1a",
      "panic: runtime error: nil pointer dereference",
    ].join("\n");
    const result = parseStackTrace(text);
    expect(result.language).toBe("go");
    expect(result.message).toContain("nil pointer");
    expect(result.frames[0].line).toBe(37);
  });

  it("falls back to unknown for unrecognized text", () => {
    const result = parseStackTrace("just some text");
    expect(result.language).toBe("unknown");
    expect(result.frames).toHaveLength(0);
  });
});