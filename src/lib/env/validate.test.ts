import { describe, expect, it } from "vitest";
import { validateEnv, diffEnv, parseEnv } from "@/lib/env/validate";

describe("parseEnv", () => {
  it("skips comments and blank lines", () => {
    const entries = parseEnv("# comment\n\nFOO=bar\nBAZ=qux");
    expect(entries).toEqual([
      { key: "FOO", value: "bar", line: 3, hasValue: true },
      { key: "BAZ", value: "qux", line: 4, hasValue: true },
    ]);
  });

  it("supports export prefix and empty values", () => {
    const entries = parseEnv("export MODE=prod\nEMPTY=");
    expect(entries).toEqual([
      { key: "MODE", value: "prod", line: 1, hasValue: true },
      { key: "EMPTY", value: "", line: 2, hasValue: false },
    ]);
  });
});

describe("validateEnv", () => {
  it("catches duplicate keys and empty values", () => {
    const issues = validateEnv("A=1\nA=2\nB=");
    const kinds = issues.map((i) => i.kind);
    expect(kinds).toContain("duplicate-key");
    expect(kinds).toContain("empty-value");
  });

  it("flags invalid names and whitespace problems", () => {
    const issues = validateEnv("BAD NAME=1\n  LEAD=1\nTRAIL=1 \nSP =x");
    const kinds = issues.map((i) => i.kind);
    expect(kinds).toContain("invalid-name");
    expect(kinds).toContain("leading-space");
    expect(kinds).toContain("trailing-space");
    expect(kinds).toContain("spaces-around-equals");
  });

  it("accepts a clean file", () => {
    const issues = validateEnv('PORT=8080\nDB_URL="postgres://localhost/app"');
    expect(issues).toHaveLength(0);
  });
});

describe("diffEnv", () => {
  const a = "DB_URL=x\nLOG_LEVEL=info\nSECRET=1";
  const b = "DB_URL=x\nLOG_LEVEL=debug\nNEW_KEY=y";

  it("computes missing, extra and changed", () => {
    const diff = diffEnv(a, b);
    expect(diff.missing[0]?.key).toBe("NEW_KEY");
    expect(diff.extra).toEqual(["SECRET"]);
    expect(diff.changed[0]?.key).toBe("LOG_LEVEL");
    expect(diff.changed[0]?.a).toBe("info");
    expect(diff.changed[0]?.b).toBe("debug");
  });
});