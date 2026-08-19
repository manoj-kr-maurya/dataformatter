import { expect, test, type Page } from "@playwright/test";

const MOD_OR_CTRL = process.platform === "darwin" ? "Meta" : "Control";

const jsonSample = { name: "Ada", tags: ["a", "b"] };
const prettyJson = JSON.stringify(jsonSample, null, 2);
const base64Hello = Buffer.from("hello").toString("base64"); // aGVsbG8=
const jwt =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
  "." +
  "eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWRhIn0" +
  "." +
  "SflKxwRJSMeKKF2QT4RwMeSfJPf";

function bigJson(rows = 600): string {
  const arr: unknown[] = [];
  for (let i = 0; i < rows; i++) {
    arr.push({ id: i, name: `user${i}@example.com`, tags: ["a", "b", "c"], active: i % 2 === 0 });
  }
  return JSON.stringify(arr);
}

async function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

async function typeIntoEditor(page: Page, text: string) {
  const content = page.locator(".cm-content").first();
  await content.click();
  await page.keyboard.press(`${MOD_OR_CTRL}+A`);
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(text);
}

async function selectTool(page: Page, branch: string, label: string) {
  await page.getByRole("button", { name: "Select tool" }).click();
  await page.getByRole("menuitem", { name: branch, exact: true }).click();
  await page.getByRole("menuitem", { name: label, exact: true }).click();
}

async function editorScrollBox(page: Page, index = 0) {
  const scroller = page.locator(".cm-scroller").nth(index);
  return {
    scroller,
    box: () => scroller.evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight })),
  };
}

function statusOf(page: Page) {
  return page.getByRole("status");
}

test.describe("user-regression", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    // Never let the one-time thank-you dialog interrupt these flows.
    await page.addInitScript(() => {
      window.localStorage.setItem("devtools-thanks-shown", "1");
    });
  });

  test("boots with no console errors and no hydration mismatch", async ({ page }) => {
    const errors = await trackErrors(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Select tool" })).toBeVisible();
    await page.waitForTimeout(1500);
    expect(errors.filter((e) => !/React DevTools/i.test(e))).toEqual([]);
  });

  test("auto-detects pasted JSON, pretty-prints it, and Restore Original brings the raw input back", async ({
    page,
  }) => {
    const errors = await trackErrors(page);
    await page.goto("/");
    await typeIntoEditor(page, JSON.stringify(jsonSample));

    await expect(statusOf(page)).toHaveText("JSON detected and pretty-printed");
    const editor = page.locator(".cm-content").first();
    await expect(editor).toContainText('"name": "Ada"');
    const pretty = (await editor.innerText()) ?? "";
    expect(pretty).toMatch(/"tags":\s*\[\s*\n\s*"a"/);
    expect(pretty).toContain('{\n  "name": "Ada",');

    await page.getByRole("button", { name: "Restore Original" }).click();
    await expect(editor).toHaveText(JSON.stringify(jsonSample));

    expect(errors.filter((e) => !/React DevTools/i.test(e))).toEqual([]);
  });

  test("Restore Original no longer freezes manual-tool output", async ({ page }) => {
    await page.goto("/");
    await typeIntoEditor(page, JSON.stringify(jsonSample));

    await expect(statusOf(page)).toHaveText("JSON detected and pretty-printed");
    await page.getByRole("button", { name: "Restore Original" }).click();

    await selectTool(page, "JSON Tools", "JSON Minify");
    await expect(statusOf(page)).toHaveText("JSON minified");
    await expect(page.locator(".cm-content").first()).toHaveText(JSON.stringify(jsonSample));

    const raw = JSON.stringify(jsonSample);
    await selectTool(page, "Conversions", "JSON → Base64");
    await expect(page.locator(".cm-content").first()).toHaveText(
      Buffer.from(raw).toString("base64"),
    );
  });

  test("decodes valid Base64 to plain text in Single view", async ({ page }) => {
    await page.goto("/");
    await typeIntoEditor(page, base64Hello);
    await expect(statusOf(page)).toHaveText("Base64 decoded to plain text");
    await expect(page.locator(".cm-content").first()).toHaveText("hello");
  });

  test("detects a JWT pasted with a Bearer label", async ({ page }) => {
    await page.goto("/");
    await typeIntoEditor(page, `Bearer ${jwt}`);
    await expect(statusOf(page)).toHaveText("JWT decoded — header and payload shown");
    const editor = page.locator(".cm-content").first();
    await expect(editor).toContainText("HEADER");
    await expect(editor).toContainText("PAYLOAD");
    await expect(editor).toContainText("HS256");
    await expect(editor).toContainText('"sub": "123"');
  });

  test("Copy button copies the transformed output (not raw input)", async ({ page }) => {
    await page.goto("/");
    await typeIntoEditor(page, JSON.stringify(jsonSample));
    await expect(statusOf(page)).toHaveText("JSON detected and pretty-printed");
    await page.getByRole("button", { name: "Copy" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(prettyJson);
  });

  test("Clear empties the editor and shows the empty-state message", async ({ page }) => {
    await page.goto("/");
    await typeIntoEditor(page, JSON.stringify(jsonSample));
    await expect(statusOf(page)).toHaveText("JSON detected and pretty-printed");
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByText("Paste or type JSON, Base64, or plain text…")).toBeVisible();
    await expect(statusOf(page)).toHaveText(
      "Paste JSON or Base64 — it will be detected and transformed automatically.",
    );
  });

  test("Split view shows separate Input and Output and persists across reload", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Split" }).click();
    await expect(page.locator("section").filter({ hasText: "Input" })).toBeVisible();
    await expect(page.locator("section").filter({ hasText: "Output" })).toBeVisible();
    expect(await page.locator(".cm-scroller").count()).toBe(2);

    await typeIntoEditor(page, JSON.stringify(jsonSample));
    await expect(page.locator("section").filter({ hasText: "Output" })).toContainText(
      '"name": "Ada"',
    );

    await page.reload();
    await expect(page.locator(".cm-scroller")).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Split" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("large data is scrollable to the very end (CSS clipping regression)", async ({
    page,
  }) => {
    await page.goto("/");
    const { scroller, box } = await editorScrollBox(page);
    await typeIntoEditor(page, bigJson(600));
    await expect(statusOf(page)).toHaveText("JSON detected and pretty-printed");

    const { sh, ch } = await box();
    expect(sh).toBeGreaterThan(ch); // content is taller than the visible area — scrolling is needed

    await expect
      .poll(
        async () => {
          await scroller.evaluate((el) => {
            el.scrollTop = el.scrollHeight;
          });
          return scroller.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight);
        },
        { timeout: 15_000 },
      )
      .toBeLessThan(20);

    const topScroll = await scroller.evaluate((el) => el.scrollTop);
    expect(topScroll).toBeGreaterThan(0);
  });

  test("theme toggle flips dark class immediately and survives reload", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    expect(await html.getAttribute("class")).toContain("dark");

    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
    await expect(html).not.toHaveClass(/dark/);

    await page.reload();
    await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
    await expect(html).not.toHaveClass(/dark/);
  });

  test("single view expands to fullscreen and collapses with Escape", async ({ page }) => {
    await page.goto("/");
    await typeIntoEditor(page, JSON.stringify(jsonSample));
    const section = page.locator("section").filter({ hasText: "Input / Output" });
    const wrapper = section.locator("..");
    await expect(wrapper).toHaveCSS("position", "static");

    await page.getByRole("button", { name: "Enter fullscreen" }).click();
    await expect(wrapper).toHaveCSS("position", "fixed");

    // The toolbar stays docked at the top of the viewport, and the fullscreen
    // panel covers everything below it — bottom corners must resolve to the
    // panel, and the exit control must be visible in the docked toolbar.
    const covering = await page.evaluate(() => {
      const panel = [...document.querySelectorAll("section")].find((s) =>
        s.textContent?.includes("Input / Output"),
      );
      if (!panel) return false;
      const inPanel = (x: number, y: number) =>
        document.elementFromPoint(x, y)?.closest("section") === panel;
      return (
        inPanel(2, innerHeight - 2) &&
        inPanel(innerWidth - 2, innerHeight - 2)
      );
    });
    expect(covering).toBe(true);
    await expect(page.getByRole("button", { name: "Exit fullscreen" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(wrapper).toHaveCSS("position", "static");
  });

  test("words count is shown in the Single view header", async ({ page }) => {
    await page.goto("/");
    await typeIntoEditor(page, JSON.stringify(jsonSample));
    await expect(statusOf(page)).toHaveText("JSON detected and pretty-printed");
    const header = page.locator("header").filter({ hasText: "words" });
    await expect(header).toContainText("5 words");
    await expect(header).toContainText("7 lines");
  });

  test("Cmd/Ctrl+F opens the editor search panel and finds matches", async ({ page }) => {
    await page.goto("/");
    await typeIntoEditor(page, JSON.stringify(jsonSample));
    await page.keyboard.press(`${MOD_OR_CTRL}+F`);
    const searchPanel = page.locator(".cm-search");
    await expect(searchPanel).toBeVisible();
    await searchPanel.locator("input").first().fill("Ada");
    await expect(searchPanel).toContainText("match");
  });

  test("Cmd/Ctrl+Enter copies the full editor contents", async ({ page }) => {
    await page.goto("/");
    await typeIntoEditor(page, JSON.stringify(jsonSample));
    await expect(statusOf(page)).toHaveText("JSON detected and pretty-printed");
    await page.keyboard.press(`${MOD_OR_CTRL}+Enter`);
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(prettyJson);
  });

  test("dropping a JSON file loads and transforms it", async ({ page }) => {
    await page.goto("/");
    const dataTransfer = await page.evaluateHandle((content: string) => {
      const dt = new DataTransfer();
      dt.items.add(new File([content], "data.json", { type: "application/json" }));
      return dt;
    }, JSON.stringify(jsonSample));
    await page.locator(".cm-content").first().dispatchEvent("drop", { dataTransfer });

    await expect(statusOf(page)).toHaveText("JSON detected and pretty-printed");
    await expect(page.locator(".cm-content").first()).toContainText('"name": "Ada"');
  });
});