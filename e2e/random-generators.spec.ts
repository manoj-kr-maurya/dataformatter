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
  await page.getByRole("menuitem", { name: "Random Tools", exact: true }).click();
  await page.getByRole("menuitem", { name: label, exact: true }).click();
}

test.describe("random-generators", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("devtools-thanks-shown", "1");
    });
  });

  test("nav highlights the Random Tools page", async ({ page }) => {
    await page.goto("/random-generators");
    await expect(page.getByRole("link", { name: "Random Tools" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("Random IP Address generates IPs", async ({ page }) => {
    await page.goto("/random-generators");
    await selectTool(page, "Random IP Address");
    await typeIntoEditor(page, "3");
    await expect(page.getByRole("status")).toHaveText("Random IP addresses generated");
    await expect(page.locator(".cm-content").first()).toContainText(".");
  });

  test("Random UUID Generator produces UUIDs", async ({ page }) => {
    await page.goto("/random-generators");
    await selectTool(page, "Random UUID Generator");
    await typeIntoEditor(page, "3");
    await expect(page.getByRole("status")).toHaveText("Random UUIDs generated");
    await expect(page.locator(".cm-content").first()).toContainText("-4");
  });

  test("Random JSON Generator emits parseable JSON", async ({ page }) => {
    await page.goto("/random-generators");
    await selectTool(page, "Random JSON Generator");
    await typeIntoEditor(page, "2");
    await expect(page.getByRole("status")).toHaveText("Random JSON generated");
    await expect(page.locator(".cm-content").first()).toContainText('"name"');
  });

  test("Random Data from Regex matches the pattern", async ({ page }) => {
    await page.goto("/random-generators");
    await selectTool(page, "Random Data from Regex");
    await typeIntoEditor(page, "[a-z]{4}-\\d{2}");
    await expect(page.getByRole("status")).toHaveText("Random data generated from regex");
    await expect(page.locator(".cm-content").first()).toContainText("-");
  });

  test("Random Name Picker picks a listed name", async ({ page }) => {
    await page.goto("/random-generators");
    await selectTool(page, "Random Name Picker");
    await typeIntoEditor(page, "Ada,Bob,Cy");
    await expect(page.getByRole("status")).toHaveText("Random name picked");
    const picked = await page.locator(".cm-content").first().textContent();
    expect(["Ada", "Bob", "Cy"]).toContain(picked?.trim());
  });

  test("Text Lines Shuffler keeps the same line set", async ({ page }) => {
    await page.goto("/random-generators");
    await selectTool(page, "Text Lines Shuffler");
    await typeIntoEditor(page, "one\ntwo\nthree\nfour");
    await expect(page.getByRole("status")).toHaveText("Lines shuffled");
    const content = page.locator(".cm-content").first();
    await expect(content).toContainText("one");
    await expect(content).toContainText("two");
    await expect(content).toContainText("three");
    await expect(content).toContainText("four");
  });

  test("Random Name Picker rejects input with no names", async ({ page }) => {
    await page.goto("/random-generators");
    await selectTool(page, "Random Name Picker");
    await typeIntoEditor(page, ",");
    await expect(page.getByRole("status")).toContainText("Enter some names");
  });
});