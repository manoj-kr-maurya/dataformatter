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
  await page.getByRole("menuitem", { name: "Parsers", exact: true }).click();
  await page.getByRole("menuitem", { name: label, exact: true }).click();
}

test.describe("parsers", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("devtools-thanks-shown", "1");
    });
  });

  test("nav highlights the Parsers page", async ({ page }) => {
    await page.goto("/parsers");
    await expect(page.getByRole("link", { name: "Parsers" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("URL Parser breaks a URL into components", async ({ page }) => {
    await page.goto("/parsers");
    await selectTool(page, "URL Parser");
    await typeIntoEditor(page, "https://example.com/path?q=1&name=Ada#top");
    await expect(page.getByRole("status")).toHaveText("URL parsed into its components");
    await expect(page.locator(".cm-content").first()).toContainText("hostname: example.com");
    await expect(page.locator(".cm-content").first()).toContainText("path: /path");
    await expect(page.locator(".cm-content").first()).toContainText("q: 1");
    await expect(page.locator(".cm-content").first()).toContainText("name: Ada");
  });

  test("JSON Parser renders a typed tree", async ({ page }) => {
    await page.goto("/parsers");
    await selectTool(page, "JSON Parser");
    await typeIntoEditor(page, JSON.stringify({ name: "John", age: 30 }));
    await expect(page.getByRole("status")).toHaveText("JSON parsed into a typed tree");
    await expect(page.locator(".cm-content").first()).toContainText("root: object (2 keys)");
    await expect(page.locator(".cm-content").first()).toContainText('name (string): "John"');
    await expect(page.locator(".cm-content").first()).toContainText("age (number): 30");
  });

  test("XML Parser builds an element tree", async ({ page }) => {
    await page.goto("/parsers");
    await selectTool(page, "XML Parser");
    await typeIntoEditor(page, `<note to="Tove"><from>Jani</from></note>`);
    await expect(page.getByRole("status")).toHaveText("XML parsed into an element tree");
    await expect(page.locator(".cm-content").first()).toContainText('<note to="Tove">');
    await expect(page.locator(".cm-content").first()).toContainText("#text: " + '"Jani"');
  });

  test("YAML Parser converts YAML to JSON", async ({ page }) => {
    await page.goto("/parsers");
    await selectTool(page, "YAML Parser");
    await typeIntoEditor(page, "users:\n  - name: A\n    age: 1");
    await expect(page.getByRole("status")).toHaveText("YAML parsed to JSON");
    await expect(page.locator(".cm-content").first()).toContainText('"name": "A"');
    await expect(page.locator(".cm-content").first()).toContainText('"age": 1');
  });

  test("XML Parser rejects malformed XML", async ({ page }) => {
    await page.goto("/parsers");
    await selectTool(page, "XML Parser");
    await typeIntoEditor(page, "<a><b></a></b>");
    await expect(page.getByRole("status")).toContainText("Mismatched tag");
  });
});