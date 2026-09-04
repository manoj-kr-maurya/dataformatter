import { describe, expect, it } from "vitest";
import { buildSampleHar } from "@/lib/har/sample";
import { headerValueIsTrue, looksLikeHar, parseHar } from "@/lib/har/parse";

function minimalHar(entries: unknown[]): string {
  return JSON.stringify({ log: { version: "1.2", creator: { name: "test", version: "1.0" }, entries } });
}

function entry(input: Record<string, unknown>): Record<string, unknown> {
  return {
    startedDateTime: input.startedDateTime ?? "2026-01-01T10:00:00.000Z",
    ...(input.time !== undefined ? { time: input.time } : {}),
    request: {
      method: input.method ?? "GET",
      url: input.url ?? "https://example.com/x",
      headers: input.headers ?? [{ name: "Accept", value: "application/json" }],
      queryString: input.queryString ?? [],
      cookies: input.cookies ?? [],
      headersSize: -1,
      bodySize: 0,
      ...(input.bodyText ? { postData: { mimeType: "application/json", text: input.bodyText } } : {}),
    },
response: {
        status: input.status ?? 200,
        statusText: "OK",
        headers: input.responseHeaders ?? [{ name: "content-type", value: "application/json" }],
content: input.responseText
        ? { size: input.contentSize ?? (input.responseText as string).length, mimeType: "application/json", text: input.responseText }
        : { size: input.contentSize ?? 0, mimeType: "application/json" },
      headersSize: 200,
      bodySize: 0,
      redirectURL: input.redirectUrl ?? "",
    },
    cache: {},
    timings: input.timings ?? { blocked: 0, dns: 2, connect: 12, ssl: 8, send: 1, wait: 30, receive: 4 },
  };
}

describe("parseHar", () => {
  it("rejects empty input as invalid", () => {
    const result = parseHar("   \n  ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid");
  });

  it("reports a descriptive message for broken JSON", () => {
    const result = parseHar('{"log": {"entries": [');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid");
      expect(result.message).toBeTruthy();
    }
  });

  it("labels valid JSON that is not a HAR as not-har", () => {
    for (const input of ["{}", '{"version":1}', '{"log":{}}', '{"log":{"entries":{}}}']) {
      const result = parseHar(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("not-har");
      }
    }
  });

  it("normalizes a minimal entry: method, headers, status, timings", () => {
    const result = parseHar(
      minimalHar([
        entry({
          method: "get",
          url: "https://example.com/api/things?limit=5",
          headers: [
            { name: "Accept", value: "application/json" },
            { name: "x-request-id", value: "req-ABC" },
          ],
          queryString: [{ name: "limit", value: "5" }],
          cookies: [{ name: "session", value: "abc123" }],
          bodyText: '{"a":1}',
          responseText: '{"ok":true}',
          time: 120,
        }),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.harVersion).toBe("1.2");
    expect(result.pageCount).toBe(0);
    expect(result.summary.totalEntries).toBe(1);
    expect(result.summary.successful).toBe(1);
    expect(result.summary.failed).toBe(0);
    expect(result.summary.redirects).toBe(0);

    const view = result.entries[0];
    expect(view.method).toBe("GET");
    expect(view.status).toBe(200);
    expect(view.host).toBe("example.com");
    expect(view.path).toBe("/api/things");
    expect(view.request.headers).toEqual([
      ["Accept", "application/json"],
      ["x-request-id", "req-ABC"],
    ]);
    expect(view.request.query).toEqual([["limit", "5"]]);
    expect(view.request.cookies).toEqual([["session", "abc123"]]);
    expect(view.request.bodyText).toBe('{"a":1}');
    expect(view.request.bodyMediaType).toBe("application/json");
    expect(view.response.bodyText).toBe('{"ok":true}');
    expect(view.transferSize).toBe(11);
    expect(view.request.traceId).toBe("req-ABC");
    expect(view.timings.wait).toBe(30);
    expect(view.request.durationMs).toBe(120);
  });

  it("prefers the declared content size over the body text when both exist", () => {
    const result = parseHar(
      minimalHar([
        entry({
          responseText: '{"ok":true}',
          contentSize: 250,
          headers: [{ name: "accept-ranges", value: "bytes" }],
        }),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entries[0].transferSize).toBe(250);
  });

  it("drops invalid header records and ignores empty headers", () => {
    const result = parseHar(
      minimalHar([
        entry({
          headers: [
            { name: "X-Valid", value: "yes" },
            { name: "", value: "ignored" },
            { name: "NoValue", value: "" },
            "not-an-object",
            null,
          ],
        }),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entries[0].request.headers).toEqual([
      ["X-Valid", "yes"],
      ["NoValue", ""],
    ]);
  });

  it("counts failed, aborted and redirect statuses correctly", () => {
    const result = parseHar(
      minimalHar([
        entry({ status: 404 }),
        entry({ status: 503 }),
        entry({ status: 302, redirectUrl: "https://example.com/new" }),
        entry({ status: 0 }),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { summary } = result;
    expect(summary.failed).toBe(3);
    expect(summary.redirects).toBe(1);
    expect(summary.successful).toBe(0);
    expect(summary.byStatus).toEqual([
      { group: "3xx", count: 1 },
      { group: "4xx", count: 1 },
      { group: "5xx", count: 1 },
      { group: "other", count: 1 },
    ]);
  });

  it("clamps negative timings and keeps only present phases", () => {
    const result = parseHar(
      minimalHar([
        entry({ timings: { wait: -5, dns: 7, receive: "3", ssl: null } }),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const timings = result.entries[0].timings;
    expect(timings.wait).toBe(0);
    expect(timings.dns).toBe(7);
    expect(timings.receive).toBe(3);
    expect(timings.ssl).toBeUndefined();
    expect(timings.send).toBeUndefined();
  });

  it("sorts entries by start time ascending", () => {
    const result = parseHar(
      minimalHar([
        entry({ url: "https://example.com/late", startedDateTime: "2026-01-01T10:00:05.000Z" }),
        entry({ url: "https://example.com/early", startedDateTime: "2026-01-01T10:00:01.000Z" }),
        entry({ url: "https://example.com/mid", startedDateTime: "2026-01-01T10:00:03.000Z" }),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entries.map((view) => view.path)).toEqual(["/early", "/mid", "/late"]);
  });

  it("detects a trace id embedded in a JSON request body", () => {
    const result = parseHar(
      minimalHar([
        entry({ bodyText: '{"traceId":"trail-42","payload":true}' }),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entries[0].request.traceId).toBe("trail-42");
  });

  it("falls back to timing sum when time is absent", () => {
    const result = parseHar(
      minimalHar([entry({ timings: { dns: 10, connect: 20, wait: 70 } })]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entries[0].request.durationMs).toBe(100);
  });

  it("parses the deterministic sample HAR with 11 entries", () => {
    const result = parseHar(buildSampleHar());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entries.length).toBe(11);
    expect(result.summary.successful + result.summary.failed + result.summary.redirects).toBe(11);
    expect(result.summary.failed).toBe(5);
  });
});

describe("looksLikeHar / headerValueIsTrue", () => {
  it("recognizes log.entries arrays", () => {
    expect(looksLikeHar({ log: { entries: [] } })).toBe(true);
    expect(looksLikeHar({ log: {} })).toBe(false);
    expect(looksLikeHar(null)).toBe(false);
    expect(looksLikeHar([])).toBe(false);
  });

  it("parses boolean-ish header values", () => {
    expect(headerValueIsTrue("true")).toBe(true);
    expect(headerValueIsTrue("1")).toBe(true);
    expect(headerValueIsTrue("TRUE")).toBe(true);
    expect(headerValueIsTrue("0")).toBe(false);
    expect(headerValueIsTrue("yes")).toBe(false);
    expect(headerValueIsTrue("")).toBe(false);
  });
});