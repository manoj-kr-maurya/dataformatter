import { expect, test } from "@playwright/test";

/**
 * Advanced Debugging Suite — HAR Debugger, API Breaking Change Detector and
 * Production Error Workspace. Each tool is a self-contained workbench page
 * under the same "Debug" family, so navigation is direct and sample-data
 * driven (no hub menu involved).
 */

test.describe("HAR Debugger", () => {
  test("loads the example HAR and renders a compatibility/failing summary", async ({ page }) => {
    await page.goto("/har");
    await expect(page.getByRole("heading", { name: "HAR Debugger" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Example HAR" }).click();

    // Stats from the sample HAR: 11 entries, 5 failed.
    await expect(page.getByText("11", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("5 failed requests")).toBeVisible();

    // Findings carry severity and evidence.
    await expect(page.getByText(/POST \/api\/payment failed 3 times/)).toBeVisible();
    await expect(page.getByText(/Waiting for server response/).first()).toBeVisible();
  });
});

test.describe("API Breaking Change Detector", () => {
  test("loads the sample pair and reports breaking changes", async ({ page }) => {
    await page.goto("/api-diff");
    await expect(page.getByRole("heading", { name: "API Breaking Change Detector" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Load sample pair" }).click();

    // Breaking headlines from the sample pair.
    await expect(page.getByText('Field "shippingAddress" removed')).toBeVisible();
    await expect(page.getByText('Type changed: "integer" → "string"')).toBeVisible();
    await expect(page.getByText('New required field "version"')).toBeVisible();
  });
});

test.describe("Production Error Workspace", () => {
  test("loads the sample incident and correlates stack, logs and response", async ({ page }) => {
    await page.goto("/error-workspace");
    await expect(page.getByRole("heading", { name: "Production Error Workspace" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Load sample incident" }).click();

    // Findings appear, including the critical 500 and the repeat.
    await expect(page.getByText(/Response status 500/)).toBeVisible();
    await expect(page.getByText(/Error repeated 2 times in logs/)).toBeVisible();
    await expect(page.getByText(/checkout-service/).first()).toBeVisible();

    // The Reproduction tab renders cURL.
    await page.getByRole("tab", { name: "Reproduction" }).click();
    await expect(page.getByText("cURL", { exact: true })).toBeVisible();
    await expect(page.getByText(/x-request-id/).first()).toBeVisible();
  });

  test("renders the empty-state guidance before any evidence is pasted", async ({ page }) => {
    await page.goto("/error-workspace");
    await expect(page.getByText("Paste the evidence from an incident")).toBeVisible();
    await expect(page.getByText("No issues found in what you pasted")).toHaveCount(0);
  });
});