import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { inflateSync, inflateRawSync } from "node:zlib";
import crypto from "node:crypto";

/**
 * End-to-end coverage for share links: copy a real link, decode the URL
 * fragment independently (raw base64url vs deflate), reopen it in a new tab
 * AND in a fresh incognito context (simulating a different browser), and
 * verify the workspace reconstructs exactly.
 */

const MOD_OR_CTRL = process.platform === "darwin" ? "Meta" : "Control";
const SAMPLE = JSON.stringify({ name: "Ada", tags: ["a", "b"] });

function bigJson(rows = 1200): string {
  const arr: unknown[] = [];
  for (let i = 0; i < rows; i++) {
    arr.push({ id: i, name: `user${i}@example.com`, tags: ["a", "b", "c"], active: i % 2 === 0 });
  }
  return JSON.stringify(arr);
}

interface DecodedShare {
  codec: "d" | "r" | "n";
  encoded: string;
  rawPayload: string;
  payload: Record<string, unknown>;
}

function decodeShareUrl(url: string): DecodedShare {
  const match = url.match(/#\/share\/([dnr])\/([A-Za-z0-9_-]+)$/);
  expect(match, `URL must carry a #/share/<codec>/<payload> hash, got: ${url}`).not.toBeNull();
  const codec = match![1] as "d" | "r" | "n";
  const encoded = match![2];
  const bytes = Buffer.from(encoded, "base64url");
  const rawPayload =
    codec === "d"
      ? inflateSync(bytes).toString("utf8")
      : codec === "n"
        ? inflateRawSync(bytes).toString("utf8")
        : bytes.toString("utf8");
  return { codec, encoded, rawPayload, payload: JSON.parse(rawPayload) };
}

async function trackErrors(page: Page): Promise<string[]> {
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

async function copyShareLink(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await page.locator('[role="menuitem"]:has-text("Copy link")').click();
  // Wait until the copy handler finished (the toast fires after the write),
  // so the clipboard read below is not racing the async write.
  await expect(page.getByText(/Link (copied|shared)/i)).toBeVisible();
  return page.evaluate(() => navigator.clipboard.readText());
}

function editorText(page: Page): Promise<string> {
  return page
    .locator(".cm-content")
    .first()
    .innerText()
    .then((text) => (text ?? "").replace(/\u00a0/g, " "));
}

function logSummary(testInfo: TestInfo, label: string, details: Record<string, unknown>) {
  const body = JSON.stringify({ label, ...details }, null, 2);
  console.log(`\n[share-e2e] ${label}\n${body}\n`);
  void testInfo.attach(`${label}-summary.json`, { body, contentType: "application/json" });
}

test.describe("share links", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => {
      window.localStorage.setItem("devtools-thanks-shown", "1");
    });
  });

  test("copied link restores the exact workspace in a new tab", async ({ page, context }, testInfo) => {
    const errors = await trackErrors(page);
    await page.goto("/");
    await typeIntoEditor(page, SAMPLE);
    await expect(page.getByText("Detected: JSON — pretty-printed", { exact: true })).toBeVisible();
    const prettyInPlace = await editorText(page);

    const url = await copyShareLink(page);
    const decoded = decodeShareUrl(url);

    // URL shape + payload monitoring (v3: single view omits m, tool is a code).
    expect(url).toMatch(/^http:\/\/localhost:3000\/#\/share\/[dnr]\//);
    expect(decoded.codec).toMatch(/^[dnr]$/);
    expect(decoded.payload.v).toBe(3);
    expect(decoded.payload.m).toBeUndefined();
    expect(decoded.payload.t).toMatch(/^[0-9A-Za-z]{1,2}$/);
    expect(decoded.payload.t).not.toBe("AUTO_DETECT");
    expect(decoded.payload.i).toBe(SAMPLE);
    expect(decoded.payload.o).toBeUndefined();
    expect(decoded.payload.d).toBeUndefined();
    expect(decoded.rawPayload.length).toBeLessThan(400);

    logSummary(testInfo, "single-view-json", {
      url,
      codec: decoded.codec,
      rawPayload: decoded.rawPayload,
      payload: decoded.payload,
      urlLength: url.length,
      prettyInPlace,
    });

    // New tab: reconstruct + confirm the workspace re-runs the transform.
    const tab2 = await context.newPage();
    const tabErrors = await trackErrors(tab2);
    await tab2.goto(url);
    await expect(tab2.getByText("Detected: JSON — pretty-printed", { exact: true })).toBeVisible();
    expect(await editorText(tab2)).toBe(prettyInPlace);

    await tab2.getByRole("button", { name: "Restore Original" }).click();
    expect(await editorText(tab2)).toBe(SAMPLE);
    await tab2.close();

    expect(errors.filter((e) => !/React DevTools/i.test(e))).toEqual([]);
    expect(tabErrors.filter((e) => !/React DevTools/i.test(e))).toEqual([]);
  });

  test("same link reconstructs in a fresh incognito browser session", async ({
    page,
    browser,
  }, testInfo) => {
    await page.goto("/");
    await typeIntoEditor(page, SAMPLE);
    await expect(page.getByText("Detected: JSON — pretty-printed", { exact: true })).toBeVisible();

    const url = await copyShareLink(page);
    const decoded = decodeShareUrl(url);

    const incognitoContext = await browser.newContext();
    const fresh = await incognitoContext.newPage();
    const errors = await trackErrors(fresh);
    await fresh.goto(url);
    await expect(fresh.getByText("Detected: JSON — pretty-printed", { exact: true })).toBeVisible();
    const restored = await editorText(fresh);
    expect(restored).toContain('{\n  "name": "Ada",');
    await fresh.getByRole("button", { name: "Restore Original" }).click();
    expect(await editorText(fresh)).toBe(SAMPLE);
    await incognitoContext.close();

    logSummary(testInfo, "incognito-browser", {
      url,
      codec: decoded.codec,
      restored,
    });
    expect(errors.filter((e) => !/React DevTools/i.test(e))).toEqual([]);
  });

  test("large compressible JSON is deflated (shorter URL) and still round-trips", async ({
    page,
    context,
  }, testInfo) => {
    await page.goto("/");
    // 600 rows (~37 KB raw): big enough that deflate pays off, small enough to
    // stay under the 8000-char share cap after base64url encoding.
    const huge = bigJson(600);
    await typeIntoEditor(page, huge);
    await expect(page.getByText("Detected: JSON — pretty-printed", { exact: true })).toBeVisible();

    const url = await copyShareLink(page);
    const decoded = decodeShareUrl(url);

    // Compression ratio monitoring — the whole point of the deflate codec.
    expect(decoded.codec).toMatch(/^[dn]$/);
    expect(decoded.payload.i).toBe(huge);
    const ratio = Math.round((1 - decoded.encoded.length / huge.length) * 100);
    expect(decoded.encoded.length).toBeLessThan(huge.length / 4);

    logSummary(testInfo, "large-deflated", {
      codec: decoded.codec,
      hugeChars: huge.length,
      urlHashChars: decoded.encoded.length,
      urlFullLength: url.length,
      compressionSavingsPercent: ratio,
      payloadKeys: Object.keys(decoded.payload),
    });

    const tab2 = await context.newPage();
    const tabErrors = await trackErrors(tab2);
    await tab2.goto(url);
    await expect(tab2.getByText("Detected: JSON — pretty-printed", { exact: true })).toBeVisible();
    expect(await editorText(tab2)).toContain('"name": "user0@example.com"');
    await tab2.close();
    expect(tabErrors.filter((e) => !/React DevTools/i.test(e))).toEqual([]);
  });

  test("too-large incompressible data is refused with a notice, never truncated", async ({
    page,
  }) => {
    await page.goto("/");
    // 60k chars of high-entropy hex: deflate cannot shrink it, so the URL
    // would blow past the 8000-char cap after encoding.
    const huge = crypto.randomBytes(30000).toString("hex");
    await typeIntoEditor(page, huge);

    // Sentinel: if anything got copied, we must see it overwrite this.
    await page.evaluate(() => navigator.clipboard.writeText("SENTINEL"));

    await page.getByRole("button", { name: "Share", exact: true }).click();
    await page.locator('[role="menuitem"]:has-text("Copy link")').click();
    await expect(page.getByText(/too large/i)).toBeVisible();
    await expect(page.getByText(/nothing was truncated/i)).toBeVisible();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe("SENTINEL");
  });

  test("secret-looking data is shared with a privacy warning", async ({ page, context }, testInfo) => {
    const secrets = JSON.stringify({ username: "ada", password: "hunter2" });
    await page.goto("/");
    await typeIntoEditor(page, secrets);
    await expect(page.getByText("Detected: JSON — pretty-printed", { exact: true })).toBeVisible();

    const url = await copyShareLink(page);
    await expect(page.getByText(/contains secrets/i)).toBeVisible();
    const decoded = decodeShareUrl(url);
    expect(decoded.payload.i).toBe(secrets);

    logSummary(testInfo, "secrets-warning", {
      url,
      codec: decoded.codec,
      input: decoded.payload.i,
    });

    const tab2 = await context.newPage();
    await tab2.goto(url);
    await expect(tab2.getByText("Detected: JSON — pretty-printed", { exact: true })).toBeVisible();
    expect(await editorText(tab2)).toContain('"password": "hunter2"');
    await tab2.close();
  });

  test("older v2-formatted links still restore in the app", async ({ page, context }, testInfo) => {
    const legacyPayload = {
      v: 2,
      m: 1,
      t: "AUTO_DETECT",
      i: SAMPLE,
    };
    const b64 = Buffer.from(JSON.stringify(legacyPayload)).toString("base64url");
    const url = `http://localhost:3000/#/share/r/${b64}`;

    const errors = await trackErrors(page);
    await page.goto(url);
    await expect(page.getByText("Detected: JSON — pretty-printed", { exact: true })).toBeVisible();
    expect(await editorText(page)).toContain('{\n  "name": "Ada",');
    await page.getByRole("button", { name: "Restore Original" }).click();
    expect(await editorText(page)).toBe(SAMPLE);

    logSummary(testInfo, "legacy-v2-link", { url });
    expect(errors.filter((e) => !/React DevTools/i.test(e))).toEqual([]);
    void context;
  });

  test("deterministic password output is regenerated, not embedded", async ({
    page,
    context,
  }, testInfo) => {
    await page.goto("/string-functions");
    await page.getByRole("button", { name: "Select tool" }).click();
    await page.getByRole("menuitem", { name: "String Functions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Password Generator", exact: true }).click();
    await typeIntoEditor(page, "2 12");
    await expect(page.getByText("Passwords generated", { exact: true })).toBeVisible();

    const url = await copyShareLink(page);
    const decoded = decodeShareUrl(url);

    // Non-deterministic tool => output MUST be stored verbatim; the tool id is
    // a short code in the URL, never the full "PASSWORD_GENERATOR" string.
    expect(decoded.codec).toBe("r");
    expect(decoded.payload.t).toMatch(/^[0-9A-Za-z]{1,2}$/);
    expect(decoded.payload.t).not.toBe("PASSWORD_GENERATOR");
    expect(decoded.payload.i).toBe("2 12");
    expect(typeof decoded.payload.o).toBe("string");
    expect((decoded.payload.o as string).split("\n")).toHaveLength(2);

    logSummary(testInfo, "password-generator", {
      url,
      codec: decoded.codec,
      payload: decoded.payload,
      outputLines: (decoded.payload.o as string).split("\n").map((line) => line.length),
    });

    const tab2 = await context.newPage();
    await tab2.goto(url);
    await expect(tab2.getByText("Passwords generated", { exact: true })).toBeVisible();
    expect(await editorText(tab2)).toBe(decoded.payload.o);
    await tab2.close();
  });
});