import { expect, test, type Locator, type Page } from "@playwright/test";

const MOD_OR_CTRL = process.platform === "darwin" ? "Meta" : "Control";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("devtools-thanks-shown", "1");
  });
});

async function typeIntoEditor(page: Page, text: string) {
  const content = page.locator(".cm-content").first();
  await content.click();
  await page.keyboard.press(`${MOD_OR_CTRL}+A`);
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(text);
}

async function typeIn(page: Page, target: Locator, text: string) {
  await target.click();
  await page.keyboard.press(`${MOD_OR_CTRL}+A`);
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(text);
}

/** Focus without clicking — the embedded workspaces hand off to the app shell on pointerdown. */
async function focusEditor(page: Page) {
  const content = page.locator(".cm-content").first();
  await content.evaluate((el) => (el as HTMLElement).focus());
  await page.keyboard.press(`${MOD_OR_CTRL}+A`);
  await page.keyboard.press("Backspace");
}

/** Scope a Toolbox card by its <h2> so page SEO/info sections can't create strict-mode collisions. */
function toolbox(page: Page, title: string | RegExp): Locator {
  return page.locator("section", { has: page.getByRole("heading", { name: title, exact: true }) });
}

const JSON_ARRAY = '[{"name":"Ada","age":30}]';

test.describe("new landing pages with embedded workspaces", () => {
  test("/json-to-csv turns JSON input into a CSV", async ({ page }) => {
    await page.goto("/json-to-csv");
    await focusEditor(page);
    await page.keyboard.insertText(JSON_ARRAY);
    await expect(page.getByRole("status")).toHaveText("JSON converted to CSV");
    await expect(page.locator(".cm-content").first()).toContainText("Ada");
  });

  test("/json-to-yaml turns JSON into YAML", async ({ page }) => {
    await page.goto("/json-to-yaml");
    await focusEditor(page);
    await page.keyboard.insertText('{"name":"Ada","age":30}');
    await expect(page.getByRole("status")).toHaveText("JSON converted to YAML");
    await expect(page.locator(".cm-content").first()).toContainText("name: Ada");
  });

  test("/uuid-generator emits RFC 4122 v4 UUIDs", async ({ page }) => {
    await page.goto("/uuid-generator");
    await focusEditor(page);
    await page.keyboard.insertText("3");
    await expect(page.getByRole("status")).toHaveText("Random UUIDs generated");
    const inner = page.locator(".cm-content").first();
    const text = await inner.evaluate((el) => (el as HTMLElement).innerText ?? "");
    const lines = text.split("\n").filter((l) => l.length > 0);
    expect(lines.length).toBe(3);
    for (const line of lines) {
      expect(line).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    }
  });
});

test.describe("workbench input→output matrix", () => {
  test("JSON Diff compares two documents and renders changes", async ({ page }) => {
    await page.goto("/json-diff");
    const differences = toolbox(page, "Differences");
    await expect(differences).toContainText("license");
    await expect(page.getByText("added", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("changed", { exact: true }).first()).toBeVisible();

    const b = page.getByLabel("Changed JSON (B)");
    await typeIn(page, b, '{"name":"DataFormatter","version":2,"tags":["json","diff","seo"],"owner":{"id":7,"active":true},"stable":true}');
    await expect(differences).toContainText("No differences.");
  });

  test("JSON to Code generates code from an inferred schema", async ({ page }) => {
    await page.goto("/json-to-code");
    const pre = page.locator("pre").first();
    await expect(pre).toContainText("id");
    await page.getByLabel("Target type name").fill("Account");
    await expect(pre).toContainText("Account");
  });

  test("JSON to Schema derives a validation schema", async ({ page }) => {
    await page.goto("/json-to-schema");
    const pre = page.locator("pre").first();
    await expect(pre).toContainText("id");
    await page.getByLabel("Model name").fill("Member");
    await expect(pre).toContainText("Member");
  });

  test("Regex workbench list matches for an email pattern", async ({ page }) => {
    await page.goto("/regex");
    const text = page.getByLabel("Test text");
    await typeIn(page, text, "alice@example.com bob@test.co");
    await page.getByRole("button", { name: "Email", exact: true }).click();
    await expect(page.getByText("2 found", { exact: true })).toBeVisible();
    await expect(toolbox(page, "Matches")).toContainText("alice@example.com");
  });

  test("Log analyzer tallies levels, error groups and timeline", async ({ page }) => {
    await page.goto("/log-analyzer");
    const analysis = toolbox(page, "Analysis");
    await expect(analysis).toContainText("ERROR");
    await expect(analysis).toContainText("WARN");

    await page.getByRole("button", { name: "Error groups", exact: true }).click();
    await expect(analysis).toContainText("3x");
    await expect(analysis).toContainText("Rejected order 4815: stock unavailable");

    await page.getByRole("button", { name: "Timeline", exact: true }).click();
    await expect(analysis).toContainText("08:00");
  });

  test("HTTP header inspector flags known headers and filters findings", async ({ page }) => {
    await page.goto("/http-header-inspector");
    const findings = toolbox(page, "Findings");
    await expect(findings).toContainText("content-type");
    await expect(findings).toContainText("strict-transport-security");

    await page.getByLabel("Filter findings").fill("set-cookie");
    await expect(findings).toContainText("Session");
    await expect(findings).not.toContainText("content-type");
  });

  test("Stack trace parser reads Java and Node frames", async ({ page }) => {
    await page.goto("/stack-trace");
    await expect(toolbox(page, "Exception")).toContainText("java.lang.NullPointerException");
    await expect(toolbox(page, "Call chain")).toContainText("charge");

    await page.getByRole("button", { name: "Node/JS sample", exact: true }).click();
    await expect(toolbox(page, "Exception")).toContainText("TypeError");
    await expect(toolbox(page, "Call chain")).toContainText("formatUser");
  });

  test("cURL to code parses the request and emits code", async ({ page }) => {
    await page.goto("/curl-to-code");
    const generated = toolbox(page, /^Generated /);
    await expect(generated).toContainText("dryRun");
    await expect(generated).toContainText("abc123");
    const normalized = toolbox(page, "Normalized cURL");
    await expect(normalized).toContainText("--request POST");
  });

  test("Cron explains an expression and lists next runs", async ({ page }) => {
    await page.goto("/cron");
    const meaning = toolbox(page, "What it means");
    await expect(meaning).toContainText("at minute 30");

    await page.getByRole("button", { name: "Every minute", exact: true }).click();
    await expect(meaning).toContainText("every minute");

    await page.getByLabel("Run count").fill("3");
    await expect(toolbox(page, "Next runs").locator("tbody tr")).toHaveCount(3);
  });

  test("Timestamp converter decodes ms and epoch-0", async ({ page }) => {
    await page.goto("/timestamp");
    await expect(page.getByText("1736956800", { exact: true })).toBeVisible();
    await expect(page.getByText("2025-01-15T16:00:00.000Z", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Unix 0", exact: true }).click();
    await expect(page.getByText("1970-01-01T00:00:00.000Z", { exact: true })).toBeVisible();
    await expect(page.getByText("0", { exact: true }).first()).toBeVisible();
  });

  test("ENV validator finds no issues and diffs two files", async ({ page }) => {
    await page.goto("/env-validator");
    await expect(page.getByText("No problems detected", { exact: false })).toBeVisible();

    await page.getByRole("button", { name: "Compare A vs B", exact: true }).click();
    await expect(page.getByText("Value changed", { exact: true })).toBeVisible();
    await expect(page.getByText("NODE_ENV (development → production)", { exact: true })).toBeVisible();
  });

  test("Developer calculator evaluates, converts radix and hashes CRC32", async ({ page }) => {
    await page.goto("/developer-calculator");
    await page.getByLabel("Arithmetic expression").fill("2 + 3 * 4");
    await expect(toolbox(page, "Result")).toContainText("14");

    await page.getByRole("button", { name: "Radix", exact: true }).click();
    await page.getByLabel("Number to convert").fill("255");
    await expect(toolbox(page, "Radix breakdown")).toContainText("0b11111111");
    await expect(toolbox(page, "Radix breakdown")).toContainText("0xff");

    await page.getByRole("button", { name: "Bytes", exact: true }).click();
    await page.getByLabel("Text to measure").fill("hello");
    await expect(page.getByText("aGVsbG8=", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "CRC32", exact: true }).click();
    await page.getByLabel("CRC32 input").fill("hello");
    await expect(toolbox(page, "CRC-32")).toContainText("0x3610a686");

    await page.getByRole("button", { name: "Percent", exact: true }).click();
    await expect(toolbox(page, "A is what % of B?")).toContainText("25%");
  });

  test("Fake data detects fields from a pasted sample and stays deterministic", async ({ page }) => {
    await page.goto("/fake-data");
    const preview = page.locator("pre").first();
    await expect(preview).toContainText('"name"');

    await page.getByRole("button", { name: "Paste sample…", exact: true }).click();
    await page
      .getByLabel("Sample data")
      .fill('[{"name":"Ada","email":"ada@example.com","paid":true}]');
    await page.getByRole("button", { name: "Detect fields", exact: true }).click();

    await expect(page.getByText("3 columns", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Field 1 name")).toHaveValue("name");
    await expect(page.getByLabel("Field 2 type")).toHaveValue("email");
    await expect(page.getByLabel("Field 3 type")).toHaveValue("boolean");

    await page.getByLabel("Row count").fill("2");
    await page.getByLabel("Seed").fill("demo");
    await expect(page.getByText("2rows", { exact: true })).toBeVisible();
    const first = await preview.textContent();
    await page.getByLabel("Seed").fill("other");
    const second = await preview.textContent();
    expect(first).not.toBe(second);
    await page.getByLabel("Seed").fill("demo");
    await expect.poll(() => preview.textContent()).toBe(first);
  });

  test("Compiler runs JavaScript and prints stdout", async ({ page }) => {
    await page.goto("/compiler");
    await page.getByRole("tab", { name: "JS", exact: true }).click();
    await page.evaluate(() => document.querySelector<HTMLElement>(".cm-content")?.focus());
    await typeIntoEditor(page, `console.log("hi from compiler");`);
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.getByRole("log")).toContainText("hi from compiler", {
      timeout: 15_000,
    });
  });

  test("API client sends a request and renders the JSON response", async ({ page }) => {
    await page.route("**/phony.test/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, echo: "pong" }),
      }),
    );
    await page.goto("/api-client");
    await page.getByLabel("Request URL").fill("https://phony.test/api/ping");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(page.getByText('"ok": true', { exact: false })).toBeVisible();
    await expect(page.getByText('"echo": "pong"', { exact: false })).toBeVisible();
  });

  test("API tester sends a request and renders the JSON response", async ({ page }) => {
    await page.route("**/phony.example/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, echo: "pong" }),
      }),
    );
    await page.goto("/api-tester");
    await page.getByLabel("Request URL").fill("https://phony.example/health");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(page.getByText('"ok": true', { exact: false })).toBeVisible();
  });
});