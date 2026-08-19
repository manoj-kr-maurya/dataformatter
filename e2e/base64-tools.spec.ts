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
  await page.getByRole("menuitem", { name: "Base64 Tools", exact: true }).click();
  await page.getByRole("menuitem", { name: label, exact: true }).click();
}

test.describe("base64-tools", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("devtools-thanks-shown", "1");
    });
  });

  test("Hex to Base64 then Base64 to Hex round-trip", async ({ page }) => {
    await page.goto("/base64");
    await expect(page.getByRole("link", { name: "Base64", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await selectTool(page, "Hex to Base64");
    await typeIntoEditor(page, "48656c6c6f");
    await expect(page.getByRole("status")).toHaveText("Hex encoded as Base64");
    await expect(page.locator(".cm-content").first()).toHaveText("SGVsbG8=");

    await selectTool(page, "Base64 to Hex");
    await typeIntoEditor(page, "SGVsbG8=");
    await expect(page.getByRole("status")).toHaveText("Base64 decoded to hex");
    await expect(page.locator(".cm-content").first()).toHaveText("48656c6c6f");
  });

  test("Binary to Base64 then Base64 to Binary round-trip", async ({ page }) => {
    await page.goto("/base64");
    await selectTool(page, "Binary to Base64");
    await typeIntoEditor(page, "0100100001101001");
    await expect(page.getByRole("status")).toHaveText("Binary encoded as Base64");
    await expect(page.locator(".cm-content").first()).toHaveText("SGk=");

    await selectTool(page, "Base64 to Binary");
    await typeIntoEditor(page, "SGk=");
    await expect(page.getByRole("status")).toHaveText("Base64 decoded to binary");
    await expect(page.locator(".cm-content").first()).toHaveText("0100100001101001");
  });

  test("Octal to Base64 converts octal bytes", async ({ page }) => {
    await page.goto("/base64");
    await selectTool(page, "Octal to Base64");
    await typeIntoEditor(page, "110 151");
    await expect(page.getByRole("status")).toHaveText("Octal encoded as Base64");
    await expect(page.locator(".cm-content").first()).toHaveText("SGk=");
  });

  test("CSV to Base64 then Base64 to CSV round-trip", async ({ page }) => {
    await page.goto("/base64");
    await selectTool(page, "CSV → Base64");
    await typeIntoEditor(page, "name,age\nJohn,30");
    await expect(page.getByRole("status")).toHaveText("CSV encoded as Base64");
    await expect(page.locator(".cm-content").first()).toHaveText("bmFtZSxhZ2UKSm9obiwzMA==");

    await selectTool(page, "Base64 → CSV");
    await typeIntoEditor(page, "bmFtZSxhZ2UKSm9obiwzMA==");
    await expect(page.getByRole("status")).toHaveText("Base64 decoded to CSV");
    await expect(page.locator(".cm-content").first()).toContainText("name,age");
    await expect(page.locator(".cm-content").first()).toContainText("John,30");
  });

  test("XML to Base64 then Base64 to XML round-trip", async ({ page }) => {
    await page.goto("/base64");
    await selectTool(page, "XML → Base64");
    await typeIntoEditor(page, "<note><to>Tove</to></note>");
    await expect(page.getByRole("status")).toHaveText("XML encoded as Base64");
    await expect(page.locator(".cm-content").first()).toHaveText("PG5vdGU+PHRvPlRvdmU8L3RvPjwvbm90ZT4=");

    await selectTool(page, "Base64 → XML");
    await typeIntoEditor(page, "PG5vdGU+PHRvPlRvdmU8L3RvPjwvbm90ZT4=");
    await expect(page.getByRole("status")).toHaveText("Base64 decoded to XML");
    await expect(page.locator(".cm-content").first()).toHaveText("<note><to>Tove</to></note>");
  });

  test("Base64 to Image produces a PNG data URI", async ({ page }) => {
    await page.goto("/base64");
    await selectTool(page, "Base64 to Image");
    await typeIntoEditor(
      page,
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    );
    await expect(page.getByRole("status")).toHaveText("Base64 converted to an image data URI");
    await expect(page.locator(".cm-content").first()).toContainText(
      "data:image/png;base64,iVBORw0KGgo",
    );
  });

  test("Base64 Tools branches through the hamburger and rejects bad input", async ({ page }) => {
    await page.goto("/base64");
    await selectTool(page, "Hex to Base64");
    await typeIntoEditor(page, "zz");
    await expect(page.getByRole("status")).toContainText("Invalid hex");
  });
});