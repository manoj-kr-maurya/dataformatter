import { describe, expect, it } from "vitest";
import { buildSampleHar } from "@/lib/har/sample";
import { type HarEntryView, parseHar } from "@/lib/har/parse";
import { analyzeHar, DEFAULT_SLOW_THRESHOLD_MS } from "@/lib/har/analyze";

function analyzeSample(options?: { slowThresholdMs?: number; largeThresholdBytes?: number }) {
  const parsed = parseHar(buildSampleHar());
  if (!parsed.ok) throw new Error("sample should parse");
  return analyzeHar(parsed.entries, parsed.summary, options);
}

const titles = (entries: { title: string }[]) => entries.map((finding) => finding.title);

it("builds a session with one request/response per entry", () => {
  const analysis = analyzeSample();
  expect(analysis.session.requests.length).toBe(11);
  expect(analysis.session.responses.length).toBe(11);
  expect(analysis.session.findings.length).toBe(analysis.findings.length);
  expect(analysis.session.metadata?.totalEntries).toBe(11);
});

it("flags the failed requests in the sample", () => {
  const analysis = analyzeSample();
  expect(analysis.findings.some((finding) => finding.title === "5 failed requests")).toBe(true);
  expect(analysis.findings.some((finding) => finding.title === "1 authentication failure")).toBe(true);
  expect(analysis.findings.some((finding) => finding.title === "POST /api/payment failed 3 times")).toBe(true);
});

it("flags the slow order request and its primary delay phase", () => {
  const analysis = analyzeSample();
  const summary = analysis.findings.find((finding) => finding.title.startsWith("1 slow request"));
  expect(summary).toBeDefined();
  expect(summary?.severity).toBe("info");
  const detail = analysis.findings.find((finding) => finding.title === "Slow request — 4860 ms");
  expect(detail).toBeDefined();
  expect(detail?.evidence).toContain("Wait");
  expect(detail?.relatedIds).toHaveLength(1);
});

it("flags duplicate endpoints with their call counts", () => {
  const analysis = analyzeSample();
  const usernames = analysis.findings.filter((finding) => finding.title.includes("GET /api/user called 2 times"));
  expect(usernames.length).toBeGreaterThanOrEqual(1);
  expect(analysis.findings.some((finding) => finding.title.includes("POST /api/payment called 3 times"))).toBe(true);
});

it("respects a custom slow threshold", () => {
  const analysis = analyzeSample({ slowThresholdMs: 100 });
  const titlesList = titles(analysis.findings);
  expect(titlesList.some((title) => title.startsWith("Slow request —"))).toBe(true);
  expect(titlesList.some((title) => title.startsWith("6 slow requests"))).toBe(true);
});

it("reports a positive finding when nothing is slow", () => {
  const parsed = parseHar(buildSampleHar());
  if (!parsed.ok) throw new Error("sample should parse");
  const analysis = analyzeHar(parsed.entries, parsed.summary, { slowThresholdMs: 10_000 });
  expect(analysis.findings.some((finding) => finding.title === "No slow requests detected")).toBe(true);
});

it("respects a custom large-response threshold", () => {
  const analysis = analyzeSample({ largeThresholdBytes: 200 });
  expect(analysis.findings.some((finding) => finding.title === "1 large response over 200 B")).toBe(true);
});

it("keeps default thresholds documented on the result", () => {
  const analysis = analyzeSample();
  expect(analysis.slowThresholdMs).toBe(DEFAULT_SLOW_THRESHOLD_MS);
  expect(analysis.largeThresholdBytes).toBe(1024 * 1024);
  expect(analysis.maxDurationMs).toBe(4860);
});

it("warns about captured Bearer credentials", () => {
  const analysis = analyzeSample();
  const finding = analysis.findings.find((finding) => finding.title === "Authorization (Bearer) headers captured");
  expect(finding).toBeDefined();
  expect(finding?.severity).toBe("warning");
  expect(finding?.confidence).toBe("high");
});

it("inspects security headers on a sampled 2xx response", () => {
  const analysis = analyzeSample();
  const titlesList = titles(analysis.findings);
  expect(titlesList.some((title) => title === "STRICT-TRANSPORT-SECURITY not detected")).toBe(true);
  expect(titlesList.some((title) => title === "CONTENT-SECURITY-POLICY not detected")).toBe(true);
});

it("reports the sample redirect chain", () => {
  const analysis = analyzeSample();
  expect(analysis.findings.some((finding) => finding.title === "1 redirect (1 chain)")).toBe(true);
});

it("flags repeated resources that carry no caching headers", () => {
  const parsed = parseHar(
    JSON.stringify({
      log: {
        version: "1.2",
        entries: [
          {
            startedDateTime: "2026-01-01T10:00:00.000Z",
            time: 10,
            request: {
              method: "GET",
              url: "https://example.com/api/user",
              headers: [{ name: "Accept", value: "application/json" }],
              queryString: [],
              cookies: [],
              headersSize: 0,
              bodySize: 0,
            },
            response: {
              status: 200,
              statusText: "OK",
              headers: [{ name: "content-type", value: "application/json" }],
              content: { size: 10, mimeType: "application/json", text: "{}" },
              headersSize: 0,
              bodySize: 0,
              redirectURL: "",
            },
            cache: {},
            timings: { wait: 8, receive: 2 },
          },
          {
            startedDateTime: "2026-01-01T10:00:01.000Z",
            request: {
              method: "GET",
              url: "https://example.com/api/user",
              headers: [{ name: "Accept", value: "application/json" }],
              queryString: [],
              cookies: [],
              headersSize: 0,
              bodySize: 0,
            },
            response: {
              status: 200,
              statusText: "OK",
              headers: [{ name: "content-type", value: "application/json" }],
              content: { size: 10, mimeType: "application/json", text: "{}" },
              headersSize: 0,
              bodySize: 0,
              redirectURL: "",
            },
            cache: {},
            timings: { wait: 8, receive: 2 },
          },
        ],
      },
    }),
  );
  if (!parsed.ok) throw new Error("capture should parse");
  const analysis = analyzeHar(parsed.entries, parsed.summary);
  expect(
    analysis.findings.some((finding) => finding.title === "Repeated resource has no obvious caching headers — GET /api/user"),
  ).toBe(true);
});

it("groups findings so critical/error sort before info", () => {
  const analysis = analyzeSample();
  const severities = analysis.findings.map((finding) => finding.severity);
  const criticalIndex = severities.indexOf("critical");
  const firstInfoAfter = severities.indexOf("info");
  expect(criticalIndex).toBeGreaterThanOrEqual(0);
  if (firstInfoAfter >= 0) expect(criticalIndex).toBeLessThan(firstInfoAfter);
});

describe("analysis edge cases", () => {
  it("produces no status findings for a clean capture", () => {
    const ok = (status: number): HarEntryView => ({
      id: `r${status}`,
      method: "GET",
      url: `https://example.com/${status}`,
      host: "example.com",
      path: `/${status}`,
      status,
      statusText: "OK",
      httpVersion: "HTTP/2",
      protocol: "HTTP/2",
      headersSize: 10,
      bodySize: 0,
      transferSize: 20,
      mimeType: "application/json",
      redirectUrl: "",
      timings: { wait: 10, receive: 1 },
      request: {
        id: `r${status}`,
        method: "GET",
        url: `https://example.com/${status}`,
        host: "example.com",
        path: `/${status}`,
        status,
        statusText: "OK",
        httpVersion: "HTTP/2",
        startedAtMs: 0,
        durationMs: 11,
        headers: [],
        query: [],
        cookies: [],
        timings: { wait: 10, receive: 1 },
      },
      response: {
        id: `r${status}`,
        status,
        statusText: "OK",
        httpVersion: "HTTP/2",
        headers: [["cache-control", "public, max-age=60"]],
        bodyText: "{}",
        bodyMediaType: "application/json",
        sizeBytes: 20,
        redirectUrl: "",
      },
    });
    const entries = [ok(200), ok(200)];
    const analysis = analyzeHar(entries, {
      totalEntries: 2,
      successful: 2,
      failed: 0,
      redirects: 0,
      totalTransferred: 40,
      totalContentSize: 40,
      byStatus: [{ group: "2xx", count: 2 }],
    });
    const titlesList = titles(analysis.findings);
    expect(titlesList.some((title) => title.includes("failed"))).toBe(false);
    expect(titlesList.some((title) => title.startsWith("No slow requests"))).toBe(true);
    expect(titlesList.some((title) => title.startsWith("No redirects"))).toBe(true);
    expect(titlesList.some((title) => title.includes("cacheable"))).toBe(true);
  });
});