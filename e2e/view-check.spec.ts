import { expect, test } from "@playwright/test";

const EXPECTED_TOOLS = [
  "Base32 Encode",
  "Base32 Decode",
  "Base58 Encode",
  "Base58 Decode",
  "Base64 Encode",
  "Base64 Decode",
  "URL Encode Online",
  "URL Decode Online",
  "JSON URL Encode",
  "JSON URL Decode",
  "HTML Encode",
  "HTML Decode",
  "XML URL Encoding",
  "XML URL Decoding",
  "UTF8 Converter",
  "UTF8 Decode",
  "Hex to UTF8",
  "JSON Decode Online",
  "JSON Encode Online",
];

test("menu lists encoding tools in a sideways branch and reflects the active one", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("devtools-thanks-shown", "1");
  });
  await page.goto("/encode-decode");

  const menuButton = page.getByRole("button", { name: "Select tool" });
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("header").getByText("Auto Detect", { exact: true })).toBeVisible();

  // The rail is a slim, permanent icon+label column listing every tool
  // category — none tucked away in an overflow popup — with the current page
  // highlighted on the matching item. Scoped to the primary nav so the header
  // breadcrumb's "Home" link doesn't create a strict-mode ambiguity.
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Home", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Base64", exact: true })).toBeVisible();
  await expect(nav.getByRole("button", { name: "JWT", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "URL", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: "Hash", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Parsers", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Random", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "String", exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toBeVisible();
  await expect(
    page.getByText("Your data stays in your browser. Nothing is uploaded to our servers."),
  ).toBeVisible();

  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");

  const mainMenu = page.getByRole("menu").first();
  await expect(mainMenu.getByRole("menuitem", { name: "Auto Detect" })).toHaveAttribute(
    "aria-current",
    "true",
  );

  const branch = mainMenu.getByRole("menuitem", { name: "Encoding Tools" });
  await expect(branch).toHaveAttribute("aria-expanded", "false");
  await branch.click();
  await expect(branch).toHaveAttribute("aria-expanded", "true");

  const submenu = page.getByRole("menu").nth(1);
  await expect(submenu).toBeVisible();
  expect(await submenu.getByRole("menuitem").allInnerTexts()).toEqual(EXPECTED_TOOLS);

  await submenu.getByRole("menuitem", { name: "JSON Encode Online", exact: true }).click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("header").getByText("JSON Encode Online", { exact: true })).toBeVisible();
});

test("hovering a sidebar category reveals its internal tools", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("devtools-thanks-shown", "1");
  });
  await page.goto("/encode-decode");

  // Hovering the URL (Encoding Tools) rail item opens a fly-out with its tools.
  await page.getByRole("link", { name: "URL", exact: true }).hover();
  const flyout = page.locator("[data-tool-flyout]");
  await expect(flyout).toBeVisible();
  await expect(flyout.getByRole("link", { name: "Encoding Tools" })).toBeVisible();
  expect(await flyout.getByRole("button").allInnerTexts()).toEqual(
    expect.arrayContaining(EXPECTED_TOOLS),
  );

  // Picking a tool from the fly-out selects it and closes the fly-out.
  await flyout.getByRole("button", { name: "JSON Encode Online", exact: true }).click();
  await expect(flyout).toBeHidden();
  await expect(page.locator("header").getByText("JSON Encode Online", { exact: true })).toBeVisible();

  // Hovering another category switches the fly-out to that category's tools.
  await page.getByRole("link", { name: "Parsers", exact: true }).hover();
  await expect(flyout.getByRole("button", { name: "JSON Parser", exact: true })).toBeVisible();
});

test("branches fly out to the side and close on an outside click", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("devtools-thanks-shown", "1");
  });
  await page.goto("/encode-decode");

  await page.getByRole("button", { name: "Select tool" }).click();
  const branch = page.getByRole("menuitem", { name: "Encoding Tools", exact: true });
  await branch.click();

  const submenu = page.getByRole("menu").nth(1);
  await expect(submenu).toBeVisible();
  const branchBox = await branch.boundingBox();
  const submenuBox = await submenu.boundingBox();
  expect(submenuBox).not.toBeNull();
  expect(branchBox).not.toBeNull();
  // Submenu opens to the RIGHT of its branch (sideways, not downward).
  expect((submenuBox as { x: number; width: number }).x).toBeGreaterThan(
    (branchBox as { x: number; width: number }).x +
      (branchBox as { x: number; width: number }).width -
      4,
  );

  // A pointer down outside the menu closes it entirely.
  await page.locator(".cm-content").first().click({ position: { x: 1, y: 1 } });
  await expect(page.getByRole("button", { name: "Select tool" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("fly-out flips left on narrow screens, no page overflow, and scrolls internally", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("devtools-thanks-shown", "1");
  });
  await page.setViewportSize({ width: 500, height: 800 });
  await page.goto("/encode-decode");

  await page.getByRole("button", { name: "Select tool" }).click();
  const branch = page.getByRole("menuitem", { name: "Encoding Tools", exact: true });
  await branch.click();

  const submenu = page.getByRole("menu").nth(1);
  await expect(submenu).toBeVisible();

  const submenuBox = (await submenu.boundingBox()) as { x: number; y: number; width: number };
  const branchBox = (await branch.boundingBox()) as { x: number; width: number };
  // On a narrow viewport the submenu opens to the LEFT so it stays on-screen.
  expect(submenuBox.x).toBeLessThan(branchBox.x);

  const scrollable = await submenu.evaluate((el) => el.scrollHeight > el.clientHeight);
  expect(scrollable).toBe(true);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("privacy notice lives in the header and is suppressed on narrow screens", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("devtools-thanks-shown", "1");
  });
  await page.goto("/");

  await expect(
    page
      .locator("header")
      .getByText("Your data stays in your browser. Nothing is uploaded to our servers."),
  ).toBeVisible();

  // On a narrow viewport the full sentence is hidden to keep the header uncluttered.
  await page.setViewportSize({ width: 480, height: 800 });
  await expect(
    page.getByText("Your data stays in your browser. Nothing is uploaded to our servers."),
  ).toBeHidden();
});

test("mobile drawer opens from the header and a tool choice closes it", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("devtools-thanks-shown", "1");
  });
  await page.setViewportSize({ width: 480, height: 800 });
  await page.goto("/");

  const hamburger = page.getByRole("button", { name: "Open tools navigation" });
  await expect(hamburger).toBeVisible();
  await hamburger.click();

  const drawer = page.getByRole("dialog", { name: "Tools navigation" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "DevTools Home" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  // Expanding a section reveals its tools; picking one closes the drawer.
  await drawer.getByRole("button", { name: "Expand DevTools Home" }).click();
  await drawer.getByRole("button", { name: "JSON Format", exact: true }).click();
  await expect(drawer).toBeHidden();
  await expect(page.locator("header").getByText("JSON Format", { exact: true })).toBeVisible();
});

test("base64 encode round-trips within the encode-decode view", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("devtools-thanks-shown", "1");
  });
  await page.goto("/encode-decode");

  await page.getByRole("button", { name: "Select tool" }).click();
  await page.getByRole("menuitem", { name: "Encoding Tools", exact: true }).click();
  await page.getByRole("menuitem", { name: "Base64 Encode", exact: true }).click();

  const content = page.locator(".cm-content").first();
  await content.click();
  await page.keyboard.press(`${process.platform === "darwin" ? "Meta" : "Control"}+A`);
  await page.keyboard.insertText("Hello world");
  await expect(page.getByRole("status")).toHaveText("Base64 encoded");
  await expect(content).toHaveText("SGVsbG8gd29ybGQ=");
});