import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Debug Tools stress suite — all 8 tools in the sidebar "Debug" family are
 * exercised with complex and large inputs, and every headline output (stats,
 * findings, diff counts) is asserted against independently-constructed
 * expectations (not the analyzer code under test).
 *
 * Tools: /json-diff, /har, /api-diff, /error-workspace, /log-analyzer,
 * /stack-trace, /env-validator, /regex
 */

const MOD_OR_CTRL = process.platform === "darwin" ? "Meta" : "Control";

test.describe.configure({ timeout: 120_000 });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("devtools-thanks-shown", "1");
  });
});

/** Type into a CodeMirror editor identified by its aria-label. */
async function typeIn(page: Page, target: Locator, text: string) {
  await target.click();
  await page.keyboard.press(`${MOD_OR_CTRL}+A`);
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(text);
}

/** Stat chip renders `<value><label>` in one element (e.g. "115Requests"). */
function statChip(page: Page, label: string, value: string): Locator {
  return page.getByText(`${value}${label}`, { exact: true }).first();
}

function toolbox(page: Page, title: string | RegExp): Locator {
  return page.locator("section", { has: page.getByRole("heading", { name: title, exact: true }) });
}

// ── Shared fixture builders ──────────────────────────────────────────────────

function buildUsers(): Record<string, unknown>[] {
  const users: Record<string, unknown>[] = [];
  for (let i = 0; i < 100; i += 1) {
    users.push({ id: i, name: `user-${i}`, email: `user${i}@example.com`, age: 20 + i, active: i % 2 === 0 });
  }
  return users;
}

function buildDiffPair(): { a: Record<string, unknown>; b: Record<string, unknown> } {
  const a: Record<string, unknown> = { meta: { app: "checkout-api", version: "1.0.0", legacy: true }, users: buildUsers() };
  const b = structuredClone(a);
  (b.meta as Record<string, unknown>).version = "2.0.0";
  delete (b.meta as Record<string, unknown>).legacy;
  (b.meta as Record<string, unknown>).flag = true;
  delete (b.users as Record<string, unknown>[])[1].email;
  ((b.users as Record<string, unknown>[])[2] as Record<string, unknown>).phone = "+1 555 0100";
  ((b.users as Record<string, unknown>[])[3] as Record<string, unknown>).age = 99;
  return { a, b };
}

function buildLargeHar(): Record<string, unknown> {
  const mk = (
    method: string,
    url: string,
    status: number,
    statusText: string,
    options: { time?: number; wait?: number; body?: string; headers?: [string, string][] } = {},
  ): Record<string, unknown> => {
    const body = options.body ?? "";
    const headers = options.headers ?? [
      ["content-type", "application/json"],
      ["cache-control", "no-store"],
    ];
    const wait = options.wait ?? 10;
    return {
      startedDateTime: "2026-09-02T08:00:00.000Z",
      time: options.time ?? 0,
      request: {
        method,
        url,
        httpVersion: "HTTP/1.1",
        headers: headers.map(([name, value]) => ({ name, value })),
        queryString: [],
        cookies: [],
        headersSize: -1,
        bodySize: 0,
      },
      response: {
        status,
        statusText,
        httpVersion: "HTTP/1.1",
        headers: headers.map(([name, value]) => ({ name, value })),
        cookies: [],
        content: { size: body ? new TextEncoder().encode(body).byteLength : statusText.length, mimeType: "application/json", text: body },
        redirectURL: "",
        headersSize: -1,
        bodySize: body ? 0 : -1,
      },
      cache: {},
      timings: { blocked: 0, dns: 0, connect: 0, send: 0, wait, receive: 5, ssl: 0 },
      serverIPAddress: "10.0.0.1",
      connection: "c1",
    };
  };

  const entries: Record<string, unknown>[] = [];
  for (let i = 0; i < 6; i += 1) {
    entries.push(
      mk("POST", "https://api.example.com/api/payment", 500, "Internal Server Error", {
        headers: i === 0 ? [["content-type", "application/json"], ["authorization", "Bearer tok_123"]] : [["content-type", "application/json"]],
      }),
    );
  }
  for (let i = 0; i < 4; i += 1) {
    entries.push(mk("GET", `https://api.example.com/api/fetch?page=${i}`, 200, "OK", { headers: [["content-type", "application/json"], ["cache-control", "public, max-age=3600"]] }));
  }
  entries.push(mk("GET", "https://api.example.com/api/legacy/orders", 302, "Found", { headers: [["content-type", "text/html"]] }));
  for (let i = 0; i < 100; i += 1) {
    // Multi-line ~1.1 MB body: a single 1 MB+ line freezes the CodeMirror
    // renderer on this page, so build the large response as many lines.
    const body = i === 0 ? Array.from({ length: 35_000 }, (_, line) => `{"line":${line},"payload":"xxxxxxxxxxxx"}`).join("\n") : JSON.stringify({ id: i });
    entries.push(mk("GET", `https://api.example.com/api/data/${i}`, 200, "OK", { body, headers: [["content-type", "application/json"]] }));
  }
  entries.push(mk("POST", "https://api.example.com/api/slow/report", 200, "OK", { time: 2500, wait: 2400 }));
  entries.push(mk("GET", "https://api.example.com/api/missing/a", 404, "Not Found"));
  entries.push(mk("GET", "https://api.example.com/api/missing/b", 404, "Not Found"));
  entries.push(mk("GET", "https://api.example.com/api/private", 401, "Unauthorized"));

  return { log: { version: "1.2", creator: { name: "dataformatter-test", version: "1" }, pages: [], entries } };
}

function buildApiPair(): { previous: Record<string, unknown>; current: Record<string, unknown> } {
  const properties: Record<string, unknown> = {};
  for (let i = 0; i < 200; i += 1) {
    properties[`field_${i}`] = { type: i % 2 === 0 ? "string" : "integer" };
  }
  // Deliberate special-cased fields, defined AFTER the loop so the 0..199 span
  // cannot clobber them.
  properties.nested = { type: "object", properties: { a: { type: "string" }, b: { type: "integer" } } };
  properties.field_51 = { type: "string" };
  properties.field_53 = { type: "string", enum: ["beta", "alpha", "gamma"] };
  const previous = { type: "object", required: ["f0", "f1", "f2"], properties };
  const current = structuredClone(previous) as Record<string, unknown>;
  const props = current.properties as Record<string, unknown>;
  props.field_200 = { type: "string" };
  delete props.field_50;
  (props.field_51 as Record<string, unknown>).type = "integer";
  (props.field_53 as Record<string, unknown>).enum = ["beta", "alpha"];
  (current.required as string[]).push("f52");
  return { previous, current };
}

// ── 1. JSON Diff ─────────────────────────────────────────────────────────────

test.describe("JSON Diff — large & complex inputs", () => {
  test("matches every added/removed/changed change on a 100-user pair", async ({ page }) => {
    await page.goto("/json-diff");
    const { a, b } = buildDiffPair();
    await typeIn(page, page.getByLabel("Original JSON (A)"), JSON.stringify(a, null, 2));
    await typeIn(page, page.getByLabel("Changed JSON (B)"), JSON.stringify(b, null, 2));

    const differences = toolbox(page, "Differences");
    await expect(differences).toContainText("6 diffs");
    await expect(differences).toContainText(".users[1].email");
    await expect(differences).toContainText(".users[2].phone");
    await expect(differences).toContainText(".users[3].age");
    await expect(differences).toContainText(".meta.flag");
    await expect(differences).toContainText(".meta.version");
    await expect(differences).toContainText(".meta.legacy");

    await expect(statChip(page, "added", "2")).toBeVisible();
    await expect(statChip(page, "removed", "2")).toBeVisible();
    await expect(statChip(page, "changed", "2")).toBeVisible();
  });

  test("treats pretty-printed and minified identical docs as equal", async ({ page }) => {
    await page.goto("/json-diff");
    const doc = { meta: { app: "checkout-api", version: "1.0.0" }, users: buildUsers() };
    await typeIn(page, page.getByLabel("Original JSON (A)"), JSON.stringify(doc, null, 2)); // ~65 KB pretty
    await typeIn(page, page.getByLabel("Changed JSON (B)"), JSON.stringify(doc)); // minified

    await expect(toolbox(page, "Differences")).toContainText("No differences.");
  });

  test("survives 30 levels of nesting and still reports the leaf change", async ({ page }) => {
    await page.goto("/json-diff");
    let a: unknown = 0;
    let b: unknown = 1;
    for (let depth = 0; depth < 30; depth += 1) {
      a = { d: a };
      b = { d: b };
    }
    await typeIn(page, page.getByLabel("Original JSON (A)"), JSON.stringify(a));
    await typeIn(page, page.getByLabel("Changed JSON (B)"), JSON.stringify(b));

    const differences = toolbox(page, "Differences");
    await expect(differences).toContainText("1 diffs");
    await expect(statChip(page, "changed", "1")).toBeVisible();
  });

  test("surfaces a parse error on malformed JSON A", async ({ page }) => {
    await page.goto("/json-diff");
    await typeIn(page, page.getByLabel("Original JSON (A)"), '{"broken": tru');
    await typeIn(page, page.getByLabel("Changed JSON (B)"), "{}");

    await expect(toolbox(page, "Differences")).toContainText("JSON A:");
  });
});

// ── 2. HAR Debugger ──────────────────────────────────────────────────────────

test.describe("HAR Debugger — large capture (115 entries)", () => {
  test("reports exact summary, failures, repeats, slow, large and sensitive findings", async ({ page }) => {
    await page.goto("/har");
    await typeIn(page, page.getByLabel("HAR file input"), JSON.stringify(buildLargeHar()));

    await expect(statChip(page, "Requests", "115")).toBeVisible();
    await expect(statChip(page, "Successful", "105")).toBeVisible();
    await expect(statChip(page, "Failed", "9")).toBeVisible();
    await expect(statChip(page, "Redirects", "1")).toBeVisible();

    // Finding titles render with the severity badge concatenated onto the
    // title element (e.g. "9 failed requestsCRITICAL"), so match on substring.
    await expect(page.getByText(/9 failed requests/).first()).toBeVisible();
    await expect(page.getByText(/POST \/api\/payment failed 6 times/).first()).toBeVisible();
    await expect(page.getByText(/1 authentication failure/).first()).toBeVisible();
    await expect(page.getByText(/2 responses returned 404 Not Found/).first()).toBeVisible();
    await expect(page.getByText(/Potential duplicate request — GET \/api\/fetch called 4 times/).first()).toBeVisible();
    await expect(page.getByText(/1 slow request over 1000 ms/).first()).toBeVisible();
    await expect(page.getByText(/Slow request — 2500 ms/).first()).toBeVisible();
    await expect(page.getByText(/1 large response over 1\.0 MB/).first()).toBeVisible();
    await expect(page.getByText(/Authorization \(Bearer\) headers captured/).first()).toBeVisible();
  });
});

// ── 3. API Breaking Change Detector ──────────────────────────────────────────

test.describe("API Diff — large schema pair", () => {
  test("classifies 4 breaking and 1 non-breaking change across 201 fields", async ({ page }) => {
    await page.goto("/api-diff");
    const { previous, current } = buildApiPair();
    await typeIn(page, page.getByLabel("Previous API JSON"), JSON.stringify(previous, null, 2));
    await typeIn(page, page.getByLabel("Current API JSON"), JSON.stringify(current, null, 2));

    await expect(page.getByText("Schema comparison detected", { exact: true })).toBeVisible();
    await expect(statChip(page, "Breaking", "4")).toBeVisible();
    await expect(statChip(page, "Potentially breaking", "0")).toBeVisible();
    await expect(statChip(page, "Non-breaking", "1")).toBeVisible();
    await expect(statChip(page, "Changes", "5")).toBeVisible();

    // Finding titles concatenate the severity badge (e.g. `...removedBREAKING`).
    await expect(page.getByText(/Field "field_50" removed/).first()).toBeVisible();
    await expect(page.getByText(/Type changed: "string" → "integer"/).first()).toBeVisible();
    await expect(page.getByText(/New required field "f52"/).first()).toBeVisible();
    await expect(page.getByText(/Enum value "gamma" removed/).first()).toBeVisible();
    await expect(page.getByText(/Field "field_200" added/).first()).toBeVisible();
  });
});

// ── 4. Production Error Workspace ────────────────────────────────────────────

function buildIncidentLogs(): string {
  const specs = [
    { level: "INFO", count: 1400, message: "Processed checkout order", hour: 9 },
    { level: "WARN", count: 100, message: "queue depth at 95%", hour: 10 },
    { level: "ERROR", count: 500, message: "Timeout trying to connect to checkout-service", hour: 11 },
  ];
  const out: string[] = [];
  for (const spec of specs) {
    for (let i = 0; i < spec.count; i += 1) {
      out.push(`2026-09-02T${String(spec.hour).padStart(2, "0")}:30:00.000Z [checkout-service] ${spec.level} ${spec.message}`);
    }
  }
  return out.join("\n");
}

function buildJavaTrace(): string {
  const frames: string[] = [];
  for (let i = 0; i < 80; i += 1) {
    frames.push(`\tat com.example.checkout.PaymentService.m${i}(PaymentService.java:${100 + i})`);
  }
  return `java.lang.IllegalStateException: Connection pool exhausted for db cluster primary (4 of 10)\n${frames.join("\n")}`;
}

test.describe("Production Error Workspace — complex incident", () => {
  test("correlates a 80-frame java stack, 2000-line logs, request and 500 response", async ({ page }) => {
    await page.goto("/error-workspace");

    await page.getByRole("tab", { name: "Stack trace" }).click();
    await typeIn(page, page.getByLabel("Stack trace"), buildJavaTrace());

    await page.getByRole("tab", { name: "Service logs" }).click();
    await typeIn(page, page.getByLabel("Service logs"), buildIncidentLogs());

    await page.getByRole("tab", { name: "Request" }).click();
    await typeIn(page, page.getByLabel("Request"), "POST https://api.example.com/checkout\nContent-Type: application/json\nx-request-id: abc-123");

    await page.getByRole("tab", { name: "Response" }).click();
    await typeIn(page, page.getByLabel("Response"), '500 Internal Server Error\n\nBody:\n{"error":"timeout"}\n');

    await expect(statChip(page, "Stack errors", "1")).toBeVisible();
    await expect(statChip(page, "Log lines", "2000")).toBeVisible();
    await expect(statChip(page, "Requests", "1")).toBeVisible();
    await expect(statChip(page, "Responses", "1")).toBeVisible();
    await expect(page.getByLabel("Log level counts")).toHaveText("ERROR×500 · WARN×100 · INFO×1400");

    // Finding titles concatenate severity/tag badges onto the title element.
    await expect(page.getByText(/Stack trace parsed — java/).first()).toBeVisible();
    await expect(page.getByText(/Error repeated 500 times in logs/).first()).toBeVisible();
    await expect(page.getByText(/500 ERROR\/FATAL log line\(s\) detected/).first()).toBeVisible();
    await expect(page.getByText(/No trace IDs found in the pasted logs/).first()).toBeVisible();
    await expect(page.getByText(/Request captured — POST \/checkout/).first()).toBeVisible();
    await expect(page.getByText(/Response status 500 — server-side failure/).first()).toBeVisible();
    await expect(page.getByText(/checkout-service/).first()).toBeVisible();

    await page.getByRole("tab", { name: "Reproduction" }).click();
    const curl = page.getByLabel("Reproduction cURL");
    await expect(curl).toContainText("https://api.example.com/checkout");
    await expect(curl).toContainText("x-request-id");
  });
});

// ── 5. Log Analyzer ──────────────────────────────────────────────────────────

test.describe("Log Analyzer — 4k lines", () => {
  // CodeMirror's insertText scales superlinearly with line count on this
  // machine (4k ≈ 19s, 8k ≈ 104s, 12k OOMs), so the UI test uses 4k lines and
  // the 50k cap (slice(0, 50000)) is covered deterministically in the vitest
  // fixture-reference suite instead.
  test("tallies levels, error groups and hourly timeline", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/log-analyzer");

    const lines: string[] = [];
    const push = (ts: number, level: string, message: string, count: number) => {
      for (let i = 0; i < count; i += 1) {
        lines.push(`2026-09-02T${String(ts).padStart(2, "0")}:30:00.000Z ${level} ${message}`);
      }
    };
    push(8, "INFO", "Processed batch", 1_600);
    push(8, "ERROR", "Connection refused for service auth", 1_200);
    push(9, "ERROR", "Timed out after 30000ms", 600);
    push(9, "WARN", "Slow query took 12000ms", 600);
    await typeIn(page, page.getByLabel("Log lines"), lines.join("\n")); // 4,000 lines

    const analysis = toolbox(page, "Analysis");
    await expect(analysis).toContainText("4000 lines");
    await expect(statChip(page, "lines", "4000")).toBeVisible();
    await expect(statChip(page, "errors", "1800")).toBeVisible();
    await expect(statChip(page, "unique errors", "2")).toBeVisible();
    await expect(statChip(page, "unknown level", "0")).toBeVisible();

    await expect(page.getByText("ERROR", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("1800", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("WARN", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("600", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("INFO", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("1600", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Error groups", exact: true }).click();
    await expect(analysis).toContainText("1200x");
    await expect(analysis).toContainText("Connection refused for service auth");
    await expect(analysis).toContainText("600x");
    await expect(analysis).toContainText("Timed out after 30000ms");

    await page.getByRole("button", { name: "Timeline", exact: true }).click();
    await expect(analysis).toContainText("08:00");
    await expect(analysis).toContainText("09:00");
  });
});

// ── 6. Stack Trace Reader ────────────────────────────────────────────────────

test.describe("Stack Trace Reader — 80-frame Java trace", () => {
  test("parses exception, chain and all 80 frames", async ({ page }) => {
    await page.goto("/stack-trace");
    await typeIn(page, page.getByLabel("Stack trace"), buildJavaTrace());

    await expect(statChip(page, "language", "java")).toBeVisible();
    await expect(statChip(page, "frames", "80")).toBeVisible();

    const exception = toolbox(page, "Exception");
    await expect(exception).toContainText("java.lang.IllegalStateException");
    await expect(exception).toContainText("Connection pool exhausted for db cluster primary (4 of 10)");
    await expect(exception).toContainText("PaymentService.java:100");

    const chain = toolbox(page, "Call chain");
    await expect(chain).toContainText("12 steps");
    await expect(chain).toContainText("m0");

    const frames = toolbox(page, "Frames");
    await expect(frames).toContainText("80 frames");
    await expect(frames).toContainText("m79");
  });
});

// ── 7. ENV Validator ─────────────────────────────────────────────────────────

const VALIDATE_A = [
  "NODE_ENV=production",
  "LOG_LEVEL=info",
  "LOG_LEVEL=debug", // duplicate key
  "PORT = 8080", // spaces around equals
  "BAD KEY=no", // invalid identifier
  "trailing=value   ", // trailing whitespace
  "=oh", // missing key
  "EMPTY_VAR=", // empty value
  "JUSTAWORD", // no equals sign
  "  LEAD=no", // leading whitespace
  'DATABASE_URL="postgres://localhost/x"',
  'QUOTED="hello world"',
].join("\n");

const VALIDATE_B = ["NODE_ENV=staging", "API_KEY=abc", "DB_HOST=localhost", "ADDED_NEW=1"].join("\n");

test.describe("ENV Validator — mixed problem file + compare", () => {
  test("reports 8 issues across 7 distinct kinds", async ({ page }) => {
    await page.goto("/env-validator");
    await page.getByLabel("ENV file A").fill(VALIDATE_A);
    // No "ENV file B" in validate mode — it only exists in the compare view.

    await expect(page.getByText("8 issues", { exact: true })).toBeVisible();
    await expect(statChip(page, "issues", "8")).toBeVisible();
    await expect(statChip(page, "invalid name", "2")).toBeVisible();
    await expect(statChip(page, "duplicate key", "1")).toBeVisible();
    await expect(statChip(page, "spaces around equals", "1")).toBeVisible();
    await expect(statChip(page, "trailing space", "1")).toBeVisible();
    await expect(statChip(page, "empty value", "1")).toBeVisible();
    await expect(statChip(page, "unquoted line", "1")).toBeVisible();
    await expect(statChip(page, "leading space", "1")).toBeVisible();
    await expect(toolbox(page, "Findings")).toContainText("duplicates line 2");
  });

  test("compares A vs B and lists missing, extra and changed keys", async ({ page }) => {
    // "ENV file B" only exists in the compare view — switch first, then fill.
    await page.goto("/env-validator");
    await page.getByRole("button", { name: "Compare A vs B", exact: true }).click();
    await page.getByLabel("ENV file A").fill(VALIDATE_A);
    await page.getByLabel("ENV file B").fill(VALIDATE_B);

    const differences = toolbox(page, "Differences");
    await expect(differences).toContainText("NODE_ENV (production → staging)");
    await expect(differences).toContainText("DB_HOST");
    await expect(differences).toContainText("ADDED_NEW");
    await expect(differences).toContainText("DATABASE_URL");
    await expect(differences).toContainText("LEAD");
    await expect(differences).toContainText("distinct keys: 13");
  });
});

// ── 8. Regular Expression Tester ─────────────────────────────────────────────

test.describe("Regular Expression Tester — large & complex patterns", () => {
  const MATCH_LINES = 4000;

  test("counts every match on 4000 lines with the global flag", async ({ page }) => {
    await page.goto("/regex");
    const body = Array.from({ length: MATCH_LINES }, () => "2026-09-02 08:00:00 request user_42 ok").join("\n");
    await typeIn(page, page.getByLabel("Test text"), body);

    // Default pattern flags include "g" (from the demo row), so turn it off to
    // verify non-global behaviour reports only the first match.
    await page.getByRole("button", { name: "g", exact: true }).click();
    await page.getByLabel("Regular expression pattern").fill("user_\\d+");
    await expect(page.getByText("1 found", { exact: true })).toBeVisible();
    await expect(statChip(page, "matches", "1")).toBeVisible();

    // With /g every one of the 4000 lines matches.
    await page.getByRole("button", { name: "g", exact: true }).click();
    await expect(page.getByText("4000 found", { exact: true })).toBeVisible();
    await expect(statChip(page, "matches", "4000")).toBeVisible();
    await expect(statChip(page, "global", "yes")).toBeVisible();
    await expect(toolbox(page, "Matches")).toContainText("user_42");
  });

  test("exposes named capture groups", async ({ page }) => {
    await page.goto("/regex");
    await typeIn(page, page.getByLabel("Test text"), "order 2026-09-02 at 10:30\nnext 2026-10-05");
    await page.getByLabel("Regular expression pattern").fill("(?<year>\\d{4})-(?<month>\\d{2})");
    await page.getByRole("button", { name: "g", exact: true }).click();

    const matches = toolbox(page, "Matches");
    await expect(matches).toContainText("2026-09");
    await expect(matches).toContainText("named: year=");
    await expect(matches).toContainText("month=");
  });

  test("flags an invalid pattern", async ({ page }) => {
    await page.goto("/regex");
    await typeIn(page, page.getByLabel("Test text"), "anything");
    await page.getByLabel("Regular expression pattern").fill("(");

    await expect(statChip(page, "invalid", "pattern")).toBeVisible();
  });
});