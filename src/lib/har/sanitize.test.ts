import { describe, expect, it } from "vitest";
import { buildSampleHar } from "@/lib/har/sample";
import { parseHar } from "@/lib/har/parse";
import { sanitizeHarText } from "@/lib/har/sanitize";
import { maskAuthorizationValue } from "@/lib/debug/sanitize";

const API_KEY = "sk_live_abcd1234efgh5678";
const SESSION = "s%3Asecret-cookie-value";

function harWithSecrets(): string {
  return JSON.stringify({
    log: {
      version: "1.2",
      creator: { name: "test", version: "1.0" },
      entries: [
        {
          startedDateTime: "2026-01-01T10:00:00.000Z",
          time: 40,
          request: {
            method: "GET",
            url: "https://example.com/api/orders?token=abc123",
            headers: [
              { name: "Authorization", value: API_KEY },
              { name: "Cookie", value: SESSION },
              { name: "Accept", value: "application/json" },
            ],
            queryString: [{ name: "token", value: "abc123" }],
            cookies: [{ name: "session", value: SESSION }],
            headersSize: 0,
            bodySize: 0,
            postData: { mimeType: "application/json", text: JSON.stringify({ email: "user@example.com", token: API_KEY }) },
          },
          response: {
            status: 200,
            statusText: "OK",
            headers: [
              { name: "Set-Cookie", value: "session=" + SESSION + "; HttpOnly" },
              { name: "content-type", value: "application/json" },
            ],
            content: { size: 10, mimeType: "application/json", text: JSON.stringify({ token: API_KEY }) },
            headersSize: 0,
            bodySize: 0,
          },
          cache: {},
          timings: { wait: 38, receive: 2 },
        },
      ],
    },
  });
}

describe("sanitizeHarText", () => {
  it("returns null for invalid or non-HAR input", () => {
    expect(sanitizeHarText("{")).toBeNull();
    expect(sanitizeHarText("{}")).toBeNull();
    expect(sanitizeHarText('{"a":1}')).toBeNull();
    expect(sanitizeHarText("")).toBeNull();
    expect(sanitizeHarText("42")).toBeNull();
  });

  it("masks authorization and cookie header values", () => {
    const clean = sanitizeHarText(harWithSecrets());
    expect(clean).not.toBeNull();
    if (clean === null) return;
    const reparsed = parseHar(clean);
    expect(reparsed.ok).toBe(true);
    if (!reparsed.ok) return;

    const headers = reparsed.entries[0].request.headers;
    expect(headers.find(([name]) => name === "Authorization")?.[1]).toBe(maskAuthorizationValue(API_KEY));
    expect(headers.find(([name]) => name === "Cookie")?.[1]).not.toContain(SESSION);
    expect(headers.find(([name]) => name === "Accept")?.[1]).toBe("application/json");
  });

  it("clears request cookies", () => {
    const clean = sanitizeHarText(harWithSecrets());
    if (clean === null) return;
    const reparsed = JSON.parse(clean) as { log: { entries: { request: { cookies: unknown[] } }[] } };
    expect(reparsed.log.entries[0].request.cookies).toEqual([]);
  });

  it("scrubs token-like text from postData and response bodies", () => {
    const clean = sanitizeHarText(harWithSecrets());
    if (clean === null) return;
    expect(clean).not.toContain(API_KEY);
    expect(clean).not.toContain("sk_live");
    expect(clean).not.toContain("user@example.com");
  });

  it("produces output that still parses as valid HAR", () => {
    const clean = sanitizeHarText(buildSampleHar());
    expect(clean).not.toBeNull();
    if (clean === null) return;
    const reparsed = parseHar(clean);
    expect(reparsed.ok).toBe(true);
    if (!reparsed.ok) return;
    expect(reparsed.entries).toHaveLength(11);
    for (const entry of reparsed.entries) {
      const auth = entry.request.headers.find(([name]) => name.toLowerCase() === "authorization");
      if (auth) {
        expect(auth[1]).not.toMatch(/Bearer eyJ/);
        expect(auth[1]).toContain("••");
      }
    }
  });
});