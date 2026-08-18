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
  await page.getByRole("menuitem", { name: "String Functions", exact: true }).click();
  await page.getByRole("menuitem", { name: label, exact: true }).click();
}

test.describe("string-functions", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("devtools-thanks-shown", "1");
    });
  });

  test("nav highlights the String Functions page", async ({ page }) => {
    await page.goto("/string-functions");
    await expect(page.getByRole("link", { name: "String Functions" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("Upside Down Text flips the input", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Upside Down Text");
    await typeIntoEditor(page, "hello");
    await expect(page.getByRole("status")).toHaveText("Text flipped upside down");
    await expect(page.locator(".cm-content").first()).toContainText("ollǝɥ");
  });

  test("Random Word Generator emits words", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Random Word Generator");
    await typeIntoEditor(page, "3");
    await expect(page.getByRole("status")).toHaveText("Random words generated");
    await expect(page.locator(".cm-content").first()).toContainText(" ");
  });

  test("NTLM Hash Generator produces a hash", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "NTLM Hash Generator");
    await typeIntoEditor(page, "123456");
    await expect(page.getByRole("status")).toHaveText("NTLM hash generated");
    await expect(page.locator(".cm-content").first()).toHaveText(
      "32ed87bdb5fdc5e9cba88547376818d4",
    );
  });

  test("Password Generator outputs multiple passwords", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Password Generator");
    await typeIntoEditor(page, "2 12");
    await expect(page.getByRole("status")).toHaveText("Passwords generated");
    const text = (await page.locator(".cm-content").first().textContent()) ?? "";
    expect(text.trim().split(/\n+/).length).toBeGreaterThan(0);
  });

  test("String Builder joins lines", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "String Builder");
    await typeIntoEditor(page, ",\nalpha\nbeta\ngamma");
    await expect(page.getByRole("status")).toHaveText("String built from lines");
    await expect(page.locator(".cm-content").first()).toContainText("alpha,beta,gamma");
  });

  test("Number to Words converts 42", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Number to Words");
    await typeIntoEditor(page, "42");
    await expect(page.getByRole("status")).toHaveText("Number converted to words");
    await expect(page.locator(".cm-content").first()).toContainText("forty-two");
  });

  test("Words to Number converts back", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Words to Number");
    await typeIntoEditor(page, "one hundred twenty three");
    await expect(page.getByRole("status")).toHaveText("Words converted to numbers");
    await expect(page.locator(".cm-content").first()).toContainText("123");
  });

  test("Word Counter shows counts", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Word Counter");
    await typeIntoEditor(page, "one two\nthree");
    await expect(page.getByRole("status")).toHaveText("Text counted");
    await expect(page.locator(".cm-content").first()).toContainText("Words: 3");
  });

  test("Reverse String reverses the text", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Reverse String");
    await typeIntoEditor(page, "abc 123");
    await expect(page.getByRole("status")).toHaveText("String reversed");
    await expect(page.locator(".cm-content").first()).toContainText("321 cba");
  });

  test("String to Hex and back round-trips", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "String to Hex");
    await typeIntoEditor(page, "Hello");
    await expect(page.getByRole("status")).toHaveText("String converted to hex");
    await expect(page.locator(".cm-content").first()).toContainText("48 65 6c 6c 6f");
  });

  test("Hex to String decodes bytes", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Hex to String");
    await typeIntoEditor(page, "48 65 6c 6c 6f");
    await expect(page.getByRole("status")).toHaveText("Hex converted to string");
    await expect(page.locator(".cm-content").first()).toContainText("Hello");
  });

  test("Case Converter applies snake_case", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Case Converter");
    await typeIntoEditor(page, "snake hello world");
    await expect(page.getByRole("status")).toHaveText("Case converted");
    await expect(page.locator(".cm-content").first()).toContainText("hello_world");
  });

  test("Remove Accents strips diacritics", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Remove Accents");
    await typeIntoEditor(page, "café");
    await expect(page.getByRole("status")).toHaveText("Accents removed");
    await expect(page.locator(".cm-content").first()).toContainText("cafe");
  });

  test("Remove Duplicate Lines keeps unique lines", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Remove Duplicate Lines");
    await typeIntoEditor(page, "a\nb\na\nc");
    await expect(page.getByRole("status")).toHaveText("Duplicate lines removed");
    await expect(page.locator(".cm-content").first()).toContainText("a");
    await expect(page.locator(".cm-content").first()).toContainText("c");
  });

  test("Remove Empty Lines drops blanks", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Remove Empty Lines");
    await typeIntoEditor(page, "a\n\nb");
    await expect(page.getByRole("status")).toHaveText("Empty lines removed");
    await expect(page.locator(".cm-content").first()).toContainText("a");
  });

  test("Remove Lines Containing filters matching lines", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Remove Lines Containing");
    await typeIntoEditor(page, "bad\nkeep me\nthis is bad\nalso keep");
    await expect(page.getByRole("status")).toHaveText("Matching lines removed");
    await expect(page.locator(".cm-content").first()).toContainText("keep me");
    await expect(page.locator(".cm-content").first()).not.toContainText("this is bad");
  });

  test("Sort Text Lines sorts alphabetically", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Sort Text Lines");
    await typeIntoEditor(page, "banana\napple\ncherry");
    await expect(page.getByRole("status")).toHaveText("Lines sorted");
    await expect(page.locator(".cm-content").first()).toContainText("apple");
  });

  test("Word Frequency Counter tallies words", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Word Frequency Counter");
    await typeIntoEditor(page, "a b a");
    await expect(page.getByRole("status")).toHaveText("Word frequencies counted");
    await expect(page.locator(".cm-content").first()).toContainText("a: 2");
  });

  test("Text Repeater repeats the text", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Text Repeater");
    await typeIntoEditor(page, "2 go");
    await expect(page.getByRole("status")).toHaveText("Text repeated");
    await expect(page.locator(".cm-content").first()).toContainText("go");
  });

  test("Remove Punctuation strips punctuation", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Remove Punctuation");
    await typeIntoEditor(page, "Hello, world!");
    await expect(page.getByRole("status")).toHaveText("Punctuation removed");
    await expect(page.locator(".cm-content").first()).toContainText("Hello world");
  });

  test("Word Repeater repeats each word", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Word Repeater");
    await typeIntoEditor(page, "2 hi bye");
    await expect(page.getByRole("status")).toHaveText("Words repeated");
    await expect(page.locator(".cm-content").first()).toContainText("hi hi bye bye");
  });

  test("Delimited Text Extractor pulls matches", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Delimited Text Extractor");
    await typeIntoEditor(page, "[\n]\nalpha [beta] gamma");
    await expect(page.getByRole("status")).toHaveText("Delimited text extracted");
    await expect(page.locator(".cm-content").first()).toContainText("beta");
  });

  test("Remove Whitespace strips everything", async ({ page }) => {
    await page.goto("/string-functions");
    await selectTool(page, "Remove Whitespace");
    await typeIntoEditor(page, "a b\tc\nd");
    await expect(page.getByRole("status")).toHaveText("Whitespace removed");
    await expect(page.locator(".cm-content").first()).toContainText("abcd");
  });
});