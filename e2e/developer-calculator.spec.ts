import { expect, test, type Locator, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("devtools-thanks-shown", "1");
  });
});

/** Scope a Toolbox card by its <h2> so page SEO/info sections can't create strict-mode collisions. */
function toolbox(page: Page, title: string | RegExp): Locator {
  return page.locator("section", { has: page.getByRole("heading", { name: title, exact: true }) });
}

async function selectGroup(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).click();
}

async function selectTool(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).click();
}

test("Bitwise toolkit: operators, integer types, two's complement and float layout", async ({ page }) => {
  await page.goto("/developer-calculator");

  await selectGroup(page, "Bits");
  await selectTool(page, "Bitwise");
  await page.getByLabel("Bitwise expression", { exact: true }).fill("42 & 15");
  await expect(toolbox(page, "Breakdown")).toContainText("00000000000000000000000000001010");
  await expect(toolbox(page, "Breakdown")).toContainText("0x0000000A");

  await selectTool(page, "Integer types");
  await page.getByLabel("Value", { exact: true }).fill("256");
  await page.getByLabel("Type", { exact: true }).selectOption("UInt8");
  await expect(toolbox(page, "UInt8")).toContainText("Overflow");
  await expect(toolbox(page, "Current value")).toContainText("0x00");

  await selectTool(page, "Two's complement");
  await page.getByLabel("Value", { exact: true }).fill("-42");
  await page.getByLabel("Bit width", { exact: true }).selectOption("8");
  await expect(toolbox(page, "Interpretation")).toContainText("D6");
  await expect(toolbox(page, "Interpretation")).toContainText("-42");

  await selectTool(page, "Float");
  await page.getByLabel("Value", { exact: true }).fill("1.5");
  await page.getByLabel("Precision", { exact: true }).selectOption("32");
  await expect(toolbox(page, "Fields")).toContainText("0x3FC00000");
});

test("Data group: sizes, JSON size, timestamps and IPv4 CIDR", async ({ page }) => {
  await page.goto("/developer-calculator");

  await selectGroup(page, "Data");
  await selectTool(page, "Data size");
  await page.getByLabel("Value", { exact: true }).fill("1");
  await page.getByLabel("Unit", { exact: true }).selectOption("KiB");
  await expect(toolbox(page, "Exact size")).toContainText("1,024");

  await selectGroup(page, "Time");
  await page.getByLabel("Mode", { exact: true }).selectOption("from-timestamp");
  await page.getByLabel("Value", { exact: true }).fill("1700000000");
  await expect(toolbox(page, "Converted date")).toContainText("2023");
  await expect(toolbox(page, "All epochs")).toContainText("1700000000");

  await selectGroup(page, "Network");
  await page.getByLabel("CIDR address", { exact: true }).fill("192.168.1.0/24");
  await expect(toolbox(page, "Network")).toContainText("192.168.1.0/24");
  await expect(toolbox(page, "Address breakdown")).toContainText("254");
});

test("Estimators: performance, bandwidth, queue, storage and cache", async ({ page }) => {
  await page.goto("/developer-calculator");

  await selectGroup(page, "Perf & scale");
  await selectTool(page, "Performance");
  await page.getByLabel("Requests/sec", { exact: true }).fill("100");
  await page.getByLabel("Avg latency", { exact: true }).fill("100");
  await expect(toolbox(page, "Concurrency")).toContainText("10");
  await expect(toolbox(page, "Request rate")).toContainText("6,000");

  await selectTool(page, "Bandwidth");
  await page.getByLabel("Requests/sec", { exact: true }).fill("1000");
  await page.getByLabel("Response", { exact: true }).fill("1000");
  await expect(toolbox(page, "Throughput")).toContainText("MB");

  await selectTool(page, "Queue");
  await page.getByLabel("Events/sec", { exact: true }).fill("100");
  await page.getByLabel("Event size", { exact: true }).fill("1");
  await expect(toolbox(page, "Volume")).toContainText("8,640,000");

  await selectGroup(page, "Database");
  await selectTool(page, "Storage");
  await page.getByLabel("Records", { exact: true }).fill("1000");
  await page.getByLabel("Row size", { exact: true }).fill("1");
  await expect(toolbox(page, "Breakdown")).toContainText("1,000,000");

  await selectTool(page, "Cache");
  await page.getByLabel("Keys", { exact: true }).fill("100");
  await page.getByLabel("Value size", { exact: true }).fill("500");
  await expect(toolbox(page, "Memory")).toContainText("Per key (est.)");
});

test("Encoding group, statistics, string analysis and history", async ({ page }) => {
  await page.goto("/developer-calculator");

  await selectGroup(page, "Encoding");
  await page.getByLabel("Encoding input", { exact: true }).fill("abc");
  await expect(toolbox(page, "Sizes")).toContainText("3 B");
  await expect(toolbox(page, "Encoded values")).toContainText("YWJj");

  await selectGroup(page, "Stats & text");
  await selectTool(page, "Statistics");
  await page.getByLabel("Numbers", { exact: true }).fill("1,2,3,4,5");
  await expect(toolbox(page, "Summary")).toContainText("3");
  await expect(toolbox(page, "Spread")).toContainText("1.581");

  await selectTool(page, "String analysis");
  await page.getByLabel("String input", { exact: true }).fill("Hello 👋");
  await expect(toolbox(page, "Breakdown")).toContainText("7");
  await expect(toolbox(page, "Detailed counts")).toContainText("10");

  await selectGroup(page, "History");
  await expect(toolbox(page, "Calculation history")).toContainText("String analysis");
});