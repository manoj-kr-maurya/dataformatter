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
  await page.getByRole("menuitem", { name: "JSON Converters", exact: true }).click();
  await page.getByRole("menuitem", { name: label, exact: true }).click();
}

const users = JSON.stringify([
  { name: "John", age: 30 },
  { name: "Ada", age: 36 },
]);

test.describe("json-converter", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("devtools-thanks-shown", "1");
    });
  });

  test("nav highlights the JSON Converters page", async ({ page }) => {
    await page.goto("/json-converter");
    await expect(page.getByRole("link", { name: "JSON Converters" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("JSON to CSV flattens an array of objects", async ({ page }) => {
    await page.goto("/json-converter");
    await selectTool(page, "JSON to CSV");
    await typeIntoEditor(page, users);
    await expect(page.getByRole("status")).toHaveText("JSON converted to CSV");
    await expect(page.locator(".cm-content").first()).toContainText("name,age");
    await expect(page.locator(".cm-content").first()).toContainText("John,30");
    await expect(page.locator(".cm-content").first()).toContainText("Ada,36");
  });

  test("JSON to YAML renders a readable document", async ({ page }) => {
    await page.goto("/json-converter");
    await selectTool(page, "JSON to YAML");
    await typeIntoEditor(page, JSON.stringify({ name: "John", age: 30 }));
    await expect(page.getByRole("status")).toHaveText("JSON converted to YAML");
    await expect(page.locator(".cm-content").first()).toContainText("name: John");
    await expect(page.locator(".cm-content").first()).toContainText("age: 30");
  });

  test("JSON to XML wraps values in XML elements", async ({ page }) => {
    await page.goto("/json-converter");
    await selectTool(page, "JSON to XML");
    await typeIntoEditor(page, JSON.stringify({ name: "John" }));
    await expect(page.getByRole("status")).toHaveText("JSON converted to XML");
    await expect(page.locator(".cm-content").first()).toContainText("<name>John</name>");
  });

  test("JSON to Excel renders an HTML table", async ({ page }) => {
    await page.goto("/json-converter");
    await selectTool(page, "JSON to Excel");
    await typeIntoEditor(page, users);
    await expect(page.getByRole("status")).toHaveText("JSON converted to Excel");
    await expect(page.locator(".cm-content").first()).toContainText("<table");
    await expect(page.locator(".cm-content").first()).toContainText("<th>name</th>");
  });

  test("JSON to Java generates a POJO", async ({ page }) => {
    await page.goto("/json-converter");
    await selectTool(page, "JSON to Java");
    await typeIntoEditor(page, JSON.stringify({ name: "John", age: 30 }));
    await expect(page.getByRole("status")).toHaveText("JSON converted to Java");
    await expect(page.locator(".cm-content").first()).toContainText("public class Root {");
    await expect(page.locator(".cm-content").first()).toContainText("private String name;");
  });
});