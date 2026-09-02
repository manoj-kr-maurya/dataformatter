import { expect, test, type Page } from "@playwright/test";

const MOD_OR_CTRL = process.platform === "darwin" ? "Meta" : "Control";

const SWAGGER2 = `{ "swagger": "2.0", "info": { "title": "Legacy", "version": "1" }, "paths": {} }`;

const BAD_YAML = `openapi: 3.0.0
paths: [/a`;

async function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

async function replaceInput(page: Page, text: string) {
  const content = page.locator(".cm-content").nth(0);
  await content.click();
  await page.keyboard.press(`${MOD_OR_CTRL}+A`);
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(text);
}

test.describe("openapi-workbench", () => {
  test("loads with the example spec and boots without console errors", async ({ page }) => {
    const errors = await trackErrors(page);
    await page.goto("/openapi");

    await expect(page.locator(".cm-content").nth(0)).toContainText("openapi: 3.0.3");
    await expect(page.getByText("OpenAPI 3.0.3").first()).toBeVisible();
    await expect(page.getByText("users", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("/users", { exact: true }).first()).toBeVisible();

    await page.waitForTimeout(800);
    expect(errors.filter((e) => !/React DevTools/i.test(e))).toEqual([]);
  });

  test("explores an endpoint and previews the generated request URL", async ({ page }) => {
    await page.goto("/openapi");
    await page.getByText("/users/{userId}", { exact: true }).first().click();

    await expect(page.getByText("https://api.example.com/v2/users").first()).toBeVisible();
  });

  test("generates cURL and fetch snippets on the Code tab", async ({ page }) => {
    await page.goto("/openapi");
    await page.getByRole("button", { name: /Mock response/ }).waitFor();
    await page.getByRole("button", { name: "Code", exact: true }).click();

    const code = page.locator("pre").first();
    await expect(code).toContainText("curl");
    await expect(code).toContainText("api.example.com/v2/users");

    await page.getByRole("button", { name: "Fetch API", exact: true }).click();
    await expect(code).toContainText("fetch(");
  });

  test("previews a generated mock response body", async ({ page }) => {
    await page.goto("/openapi");
    await page.getByRole("button", { name: "Mock response", exact: true }).click();

    const body = page.locator("pre").first();
    await expect(body).toContainText("Example User");
    await expect(page.getByText(/Placeholder generated/i)).toBeVisible();
  });

  test("describes security requirements", async ({ page }) => {
    await page.goto("/openapi");
    await page.getByRole("button", { name: "Security", exact: true }).click();

    await expect(page.getByText("bearerAuth", { exact: true })).toBeVisible();
    await expect(page.getByText("HTTP Bearer token", { exact: true })).toBeVisible();
  });

  test("rejects Swagger 2.0 with a clear banner", async ({ page }) => {
    await page.goto("/openapi");
    await replaceInput(page, SWAGGER2);

    await expect(page.getByText("Swagger 2.0 is not currently supported.")).toBeVisible();
  });

  test("surfaces YAML syntax errors with a line number", async ({ page }) => {
    await page.goto("/openapi");
    await replaceInput(page, BAD_YAML);

    await expect(page.getByText(/YAML syntax error/i)).toBeVisible();
    await expect(page.getByText("at line 2, column 11", { exact: true })).toBeVisible();
  });

  test("generates an OpenAPI 3.1 type declaration from a schema", async ({ page }) => {
    const threeOne = `{
  "openapi": "3.1.0",
  "info": { "title": "t", "version": "1" },
  "paths": {
    "/widgets": {
      "get": {
        "operationId": "listWidgets",
        "responses": {
          "200": {
            "description": "OK",
            "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Widget" } } }
          }
        }
      }
    }
  },
  "components": { "schemas": { "Widget": { "type": "object", "required": ["id"], "properties": { "id": { "type": "integer" }, "label": { "type": "string" } } } } }
}`;
    await page.goto("/openapi");
    await replaceInput(page, threeOne);

    await expect(page.getByText("OpenAPI 3.1.0").first()).toBeVisible();
    await page.getByRole("button", { name: "Code", exact: true }).click();
    const types = page.locator("pre").nth(1);
    await expect(types).toContainText("export interface");
    await expect(types).toContainText("id: number");
  });
});