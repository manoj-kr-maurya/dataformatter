import { expect, test, type Page } from "@playwright/test";

const MOD_OR_CTRL = process.platform === "darwin" ? "Meta" : "Control";

async function typeIntoEditor(page: Page, text: string) {
  const content = page.locator(".cm-content").first();
  await content.click();
  await page.keyboard.press(`${MOD_OR_CTRL}+A`);
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(text);
}

async function selectTool(page: Page, label: string) {
  await page.getByRole("button", { name: "Select tool" }).click();
  await page.getByRole("menuitem", { name: "Encoding Tools", exact: true }).click();
  await page.getByRole("menuitem", { name: label, exact: true }).click();
}

test.describe("encoding-tools", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("devtools-thanks-shown", "1");
    });
  });

  test("Base32 Encode and Decode round-trip through the tabs", async ({ page }) => {
    await page.goto("/encode-decode");
    await selectTool(page, "Base32 Encode");
    await typeIntoEditor(page, "foo");
    await expect(page.getByRole("status")).toHaveText("Base32 encoded");
    await expect(page.locator(".cm-content").first()).toHaveText("MZXW6===");

    await selectTool(page, "Base32 Decode");
    await typeIntoEditor(page, "MZXW6===");
    await expect(page.getByRole("status")).toHaveText("Base32 decoded to plain text");
    await expect(page.locator(".cm-content").first()).toHaveText("foo");
  });

  test("Base58 Encode and Decode round-trip", async ({ page }) => {
    await page.goto("/encode-decode");
    await selectTool(page, "Base58 Encode");
    await typeIntoEditor(page, "hello world");
    await expect(page.getByRole("status")).toHaveText("Base58 encoded");
    await expect(page.locator(".cm-content").first()).toHaveText("StV1DL6CwTryKyV");

    await selectTool(page, "Base58 Decode");
    await typeIntoEditor(page, "StV1DL6CwTryKyV");
    await expect(page.getByRole("status")).toHaveText("Base58 decoded to plain text");
    await expect(page.locator(".cm-content").first()).toHaveText("hello world");
  });

  test("URL Encode Online then URL Decode Online round-trip", async ({ page }) => {
    await page.goto("/encode-decode");
    await selectTool(page, "URL Encode Online");
    await typeIntoEditor(page, "a b&c=d");
    await expect(page.getByRole("status")).toHaveText("URL encoded");
    await expect(page.locator(".cm-content").first()).toHaveText("a%20b%26c%3Dd");

    await selectTool(page, "URL Decode Online");
    await typeIntoEditor(page, "a%20b%26c%3Dd");
    await expect(page.getByRole("status")).toHaveText("URL decoded");
    await expect(page.locator(".cm-content").first()).toHaveText("a b&c=d");
  });

  test("HTML Encode and Decode round-trip", async ({ page }) => {
    await page.goto("/encode-decode");
    await selectTool(page, "HTML Encode");
    await typeIntoEditor(page, `<b>Tom & "Jerry"</b>`);
    await expect(page.locator(".cm-content").first()).toHaveText(
      "&lt;b&gt;Tom &amp; &quot;Jerry&quot;&lt;/b&gt;",
    );

    await selectTool(page, "HTML Decode");
    await typeIntoEditor(page, "&lt;b&gt;Tom &amp; &quot;Jerry&quot;&lt;/b&gt;");
    await expect(page.locator(".cm-content").first()).toHaveText(`<b>Tom & "Jerry"</b>`);
  });

  test("Hex to UTF8 decodes hex input", async ({ page }) => {
    await page.goto("/encode-decode");
    await selectTool(page, "Hex to UTF8");
    await typeIntoEditor(page, "48 69 20 21");
    await expect(page.locator(".cm-content").first()).toHaveText("Hi !");
  });

  test("JSON URL Encode requires valid JSON", async ({ page }) => {
    await page.goto("/encode-decode");
    await selectTool(page, "JSON URL Encode");
    await typeIntoEditor(page, '{"a":1}');
    await expect(page.getByRole("status")).toHaveText("JSON URL encoded");
    await expect(page.locator(".cm-content").first()).toHaveText(encodeURIComponent('{"a":1}'));
  });
});