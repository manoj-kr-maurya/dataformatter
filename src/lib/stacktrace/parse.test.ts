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