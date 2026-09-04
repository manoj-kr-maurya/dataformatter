import { describe, expect, it } from "vitest";
import {
  inspectHeaderBlock,
  parseHeaderBlock,
} from "@/lib/http-headers/inspect";

describe("parseHeaderBlock", () => {
  it("splits name:value lines and skips blanks", () => {
    const headers = parseHeaderBlock("content-type: text/plain\r\nServer: nginx\r\n\r\nX-Extra: 1");
    expect(headers).toEqual([
      ["content-type", "text/plain"],
      ["Server", "nginx"],
      ["X-Extra", "1"],
    ]);
  });
});

describe("inspectHeaderBlock", () => {
  it("flags credential headers as sensitive", () => {
    const result = inspectHeaderBlock("Authorization: Bearer sekrit");
    const auth = result.findings.find((f) => f.category === "Credentials");
    expect(auth?.tone).toBe("error");
  });

  it("flags CORS wildcard + credentials conflict", () => {
    const result = inspectHeaderBlock(
      "Access-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true",
    );
    const cors = result.findings.find((f) => f.category === "CORS");
    expect(cors?.tone).toBe("error");
  });

  it("reports cache-control directives", () => {
    const result = inspectHeaderBlock("Cache-Control: max-age=3600, public");
    const cache = result.findings.find((f) => f.category === "Caching");
    expect(cache?.message).toContain("max-age=3600");
  });

  it("tracks unknown headers separately", () => {
    const result = inspectHeaderBlock("x-very-private: 1");
    expect(result.unknown).toContain("x-very-private");
  });
});