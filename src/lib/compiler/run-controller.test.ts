import { describe, expect, it } from "vitest";
import { DEFAULT_EXAMPLE, COMPILER_EXAMPLES } from "@/lib/compiler/examples";
import { stdinBridgeFor, DEFAULT_PUBSPEC } from "@/lib/compiler/run-controller";

describe("stdin bridge", () => {
  it("seeds lines and resets the cursor", () => {
    const js = stdinBridgeFor("a\nb\n");
    expect(js).toContain('self.__dartpadStdinLines = ["a","b"]');
    expect(js).toContain("self.__dartpadStdinCursor = 0;");
  });

  it("produces an empty list for empty input", () => {
    const js = stdinBridgeFor("");
    expect(js).toContain("[]");
  });

  it("escapes quotes and newlines inside JSON strings", () => {
    const js = stdinBridgeFor('say "hi"\n');
    expect(js).not.toContain('say "hi"');
    expect(js).toContain('\\"hi\\"');
  });
});

describe("examples", () => {
  it("all declare a main() entrypoint", () => {
    for (const example of COMPILER_EXAMPLES) {
      expect(example.code).toMatch(/\bvoid main\(\)/);
    }
  });

  it("exposes a default example", () => {
    expect(COMPILER_EXAMPLES).toContain(DEFAULT_EXAMPLE);
  });

  it("ships a pubspec with an open SDK constraint", () => {
    expect(DEFAULT_PUBSPEC).toMatch(/sdk: \^3\.0\.0/);
  });
});
