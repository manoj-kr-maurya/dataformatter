import { expect, test, type Page } from "@playwright/test";

const MOD_OR_CTRL = process.platform === "darwin" ? "Meta" : "Control";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

async function typeIntoEditor(page: Page, text: string) {
  const content = page.locator(".cm-content").first();
  await content.click();
  await page.keyboard.press(`${MOD_OR_CTRL}+A`);
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(text);
  await page.waitForTimeout(1200);
}

async function outputText(page: Page): Promise<string> {
  const count = await page.locator(".cm-content").count();
  return page
    .locator(".cm-content")
    .nth(count - 1)
    .evaluate((el) => (el as HTMLElement).innerText ?? "");
}

async function statusText(page: Page): Promise<string> {
  return page.locator('[role="status"]').innerText();
}

test("home auto-detect: nested base64 JSON unwraps recursively in the UI", async ({ page }) => {
  await page.goto("/");
  await typeIntoEditor(page, '{"user":{"roles":["eyJpZCI6MSwibmFtZSI6ImFkbWluIn0="]}}');
  const out = await outputText(page);
  expect(out).toContain('"id": 1');
  expect(out).toContain('"admin"');
  expect(await statusText(page)).toContain("recursively decoded Base64");
});

test("home auto-detect: JWT inside JSON decodes to header/payload/signature", async ({ page }) => {
  await page.goto("/");
  await typeIntoEditor(page, JSON.stringify({ token: TOKEN }));
  const out = await outputText(page);
  expect(out).toContain('"alg": "HS256"');
  expect(out).toContain('"John Doe"');
  expect(out).toContain('"signature"');
});

test("home auto-detect: base64-of-JSON pretty-prints decoded JSON", async ({ page }) => {
  await page.goto("/");
  await typeIntoEditor(page, b64('{"name":"John","age":30}'));
  const out = await outputText(page);
  expect(out).toContain('"name": "John"');
  expect(await statusText(page)).toContain("decoded to JSON");
});

test("home auto-detect: base64-of-JSON with nested base64 recursively unwraps", async ({ page }) => {
  await page.goto("/");
  await typeIntoEditor(page, b64('{"user":{"roles":["eyJpZCI6MSwibmFtZSI6ImFkbWluIn0="]}}'));
  const out = await outputText(page);
  expect(out).toContain('"admin"');
  expect(out).toContain('"id": 1');
  expect(await statusText(page)).toContain("recursively decoded");
});

test("home auto-detect: multiple JSON documents join as JSONL", async ({ page }) => {
  await page.goto("/");
  await typeIntoEditor(page, '{"a":1} {"b":2}');
  const out = await outputText(page);
  expect(out).toContain('{"a":1}');
  expect(out).toContain('{"b":2}');
  expect(await statusText(page)).toContain("2 JSON documents");
});

test("home auto-detect: JSONL documents have their base64 values decoded", async ({ page }) => {
  await page.goto("/");
  await typeIntoEditor(page, '{"a":1} {"b":"eyJhIjoxfQ=="}');
  const out = await outputText(page);
  expect(out).toContain('{"a":1}');
  expect(out).toContain('{"b":{"a":1}}');
});

test("home auto-detect: partial JSON salvages document and labels ignored trailing", async ({ page }) => {
  await page.goto("/");
  await typeIntoEditor(page, '{"a":1} this is trailing');
  const out = await outputText(page);
  expect(out).toContain('"a": 1');
  expect(await statusText(page)).toContain("Trailing content");
});

test("home auto-detect: broken JSON without a complete document stays unchanged", async ({ page }) => {
  await page.goto("/");
  await typeIntoEditor(page, '{"name": "John", "age": 30');
  expect(await statusText(page)).toContain("Unable to confidently detect");
});

test("home auto-detect: deep 3-level recursion fully unwraps", async ({ page }) => {
  await page.goto("/");
  const l3 = JSON.stringify({
    a: b64(JSON.stringify({ b: b64(JSON.stringify({ c: [1, 2, 3] })) })),
  });
  await typeIntoEditor(page, l3);
  const out = await outputText(page);
  expect(out).toContain('"c": [');
});

function b64(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
}
