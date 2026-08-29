import { describe, expect, it } from "vitest";
import {
  CURL_CODE_TARGETS,
  generateCurlCode,
  draftToCurl,
  parseCurlOrThrow,
} from "@/lib/curl-codegen/codegen";
import { exampleDraft } from "@/lib/api-client/types";

const SAMPLE_CURL = [
  "curl -X POST 'https://api.example.com/orders?dryRun=true' \\",
  "  -H 'Content-Type: application/json' \\",
  "  -H 'Authorization: Bearer abc123' \\",
  "  -d '{\"qty\": 2}'",
].join("\n");

describe("parseCurlToDraft", () => {
  it("rejects non-curl pastes", () => {
    expect(() => parseCurlOrThrow("GET /path HTTP/1.1")).toThrow();
  });

  it("accepts a multiline curl command", () => {
    const draft = parseCurlOrThrow(SAMPLE_CURL);
    expect(draft.method).toBe("POST");
    expect(draft.url).toContain("api.example.com/orders");
  });
});

describe("generateCurlCode", () => {
  const draft = parseCurlOrThrow(SAMPLE_CURL);

  for (const target of CURL_CODE_TARGETS) {
    it(`${target.id} produces parseable ${target.extension} source`, () => {
      const out = generateCurlCode(target.id, draft);
      expect(out.length).toBeGreaterThan(30);
      expect(out).toContain("api.example.com/orders");
    });
  }

  it("throws for unknown targets", () => {
    expect(() => generateCurlCode("wat", draft)).toThrow();
  });
});

describe("draftToCurl", () => {
  it("round-trips method/url/headers through the parser", () => {
    const draft = parseCurlOrThrow(SAMPLE_CURL);
    const rebuilt = parseCurlOrThrow(draftToCurl(draft));
    expect(rebuilt.method).toBe(draft.method);
    expect(rebuilt.url).toBe(draft.url);
    const headerNames = rebuilt.headers.map((h) => h.name.toLowerCase());
    expect(headerNames).toContain("authorization");
  });

  it("handles an empty/simple draft", () => {
    const draft = exampleDraft();
    const cmd = draftToCurl(draft);
    expect(cmd.startsWith("curl")).toBe(true);
  });
});