import { expect, test, type Page } from "@playwright/test";

const MOD_OR_CTRL = process.platform === "darwin" ? "Meta" : "Control";

const PNG_1PX =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const JPG_1PX =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//9oADAMBAAIQAxAAAAF//9k=";
const YAML = "name: Ada\nage: 30";

async function typeIntoEditor(page: Page, text: string) {
  const content = page.locator(".cm-content").first();
  await content.click();
  await page.keyboard.press(`${MOD_OR_CTRL}+A`);
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(text);
}

async function focusEditor(page: Page) {
  const content = page.locator(".cm-content").first();
  await content.evaluate((el) => (el as HTMLElement).focus());
  await page.keyboard.press(`${MOD_OR_CTRL}+A`);
  await page.keyboard.press("Backspace");
}

async function selectTool(page: Page, branch: string, label: string) {
  await page.getByRole("button", { name: "Select tool" }).click();
  const branchItem = page.getByRole("menuitem", { name: branch, exact: true });
  await branchItem.waitFor({ state: "visible" });
  await page.waitForTimeout(150);
  await branchItem.click();
  const labelItem = page.getByRole("menuitem", { name: label, exact: true });
  await labelItem.waitFor({ state: "visible" });
  await page.waitForTimeout(150);
  await labelItem.click();
}

function editorText(page: Page): Promise<string> {
  return page
    .locator(".cm-content")
    .first()
    .evaluate((el) => (el as HTMLElement).innerText ?? "");
}

function checkLines(
  text: string,
  predicate: (line: string) => boolean,
  atLeast = 1,
): void {
  const lines = text.split("\n").filter((line) => line.length > 0);
  expect(lines.length).toBeGreaterThanOrEqual(atLeast);
  for (const line of lines) {
    expect(predicate(line), `line ${JSON.stringify(line)} did not match`).toBe(true);
  }
}

interface Row {
  branch: string;
  label: string;
  input: string;
  status: string;
  exact?: string;
  contains?: string[];
  lines?: (line: string) => boolean;
  /** Hub page that exposes this branch in the workspace "Select tool" menu. */
  path: string;
}

/** Each tool group's full branch menu is only offered on its own hub page. */
const branchPath: Record<string, string> = {
  "Encoding Tools": "/encode-decode",
  "Base64 Tools": "/base64",
  "JSON Converters": "/json-converter",
  "JSON Tools": "/",
  "String Functions": "/string-functions",
  Cryptography: "/cryptography-tools",
  "Random Tools": "/random-generators",
};

const rows: Row[] = [
  // Encoding Tools
  { path: "/encode-decode", branch: "Encoding Tools", label: "Base64 Encode", input: "hello", status: "Base64 encoded", exact: "aGVsbG8=" },
  { path: "/encode-decode", branch: "Encoding Tools", label: "Base64 Decode", input: "aGVsbG8=", status: "Base64 decoded to plain text", exact: "hello" },
  {
    path: "/encode-decode",
    branch: "Encoding Tools",
    label: "JSON URL Decode",
    input: encodeURIComponent('{"a":1}'),
    status: "JSON URL decoded and formatted",
    contains: ['"a": 1'],
  },
  {
    path: "/encode-decode",
    branch: "Encoding Tools",
    label: "XML URL Encoding",
    input: 'a b<c>&"',
    status: "XML URL encoded",
    exact: "a%20b%3Cc%3E%26%22",
  },
  {
    path: "/encode-decode",
    branch: "Encoding Tools",
    label: "XML URL Decoding",
    input: "a%20b%26lt%3Bc%26gt%3B&amp%3B",
    status: "XML URL decoded",
    exact: "a b&lt;c&gt;&amp;",
  },
  {
    path: "/encode-decode",
    branch: "Encoding Tools",
    label: "UTF8 Converter",
    input: "héllo",
    status: "Converted to UTF-8 escape sequences",
    exact: "h\\u00e9llo",
  },
  {
    path: "/encode-decode",
    branch: "Encoding Tools",
    label: "UTF8 Decode",
    input: "h\\u00e9llo",
    status: "UTF-8 escape sequences decoded",
    exact: "héllo",
  },
  { path: "/encode-decode", branch: "Encoding Tools", label: "JSON Encode Online", input: "hello", status: "JSON string encoded", exact: '"hello"' },
  { path: "/encode-decode", branch: "Encoding Tools", label: "JSON Decode Online", input: '"hello"', status: "JSON string decoded", exact: "hello" },

  // Base64 Tools
  {
    path: "/base64",
    branch: "Base64 Tools",
    label: "Image to Base64",
    input: PNG_1PX,
    status: "Image converted to Base64",
    exact: PNG_1PX,
  },
  {
    path: "/base64",
    branch: "Base64 Tools",
    label: "PNG to Base64",
    input: PNG_1PX,
    status: "PNG converted to Base64",
    exact: PNG_1PX,
  },
  {
    path: "/base64",
    branch: "Base64 Tools",
    label: "JPG to Base64",
    input: JPG_1PX,
    status: "JPG converted to Base64",
    contains: ["/9j/"],
  },
  {
    path: "/base64",
    branch: "Base64 Tools",
    label: "YAML → Base64",
    input: YAML,
    status: "YAML encoded as Base64",
    exact: Buffer.from(YAML, "utf8").toString("base64"),
  },
  {
    path: "/base64",
    branch: "Base64 Tools",
    label: "Base64 → YAML",
    input: Buffer.from(YAML, "utf8").toString("base64"),
    status: "Base64 decoded to YAML",
    contains: ["name: Ada", "age: 30"],
  },
  {
    path: "/base64",
    branch: "Base64 Tools",
    label: "TSV → Base64",
    input: "a\t1\nb\t2",
    status: "TSV encoded as Base64",
    exact: "YQkxCmIJMg==",
  },
  {
    path: "/base64",
    branch: "Base64 Tools",
    label: "Base64 → TSV",
    input: "YQkxCmIJMg==",
    status: "Base64 decoded to TSV",
    contains: ["a"],
  },

  // JSON Converters
  {
    path: "/json-converter",
    branch: "JSON Converters",
    label: "JSON to TSV",
    input: '[{"name":"Ada","age":30}]',
    status: "JSON converted to TSV",
    contains: ["name", "Ada"],
  },
  {
    path: "/json-converter",
    branch: "JSON Converters",
    label: "JSON to Text",
    input: '{"name":"Ada","age":30}',
    status: "JSON converted to plain text",
    contains: ["name: Ada"],
  },
  {
    path: "/json-converter",
    branch: "JSON Converters",
    label: "JSON to HTML",
    input: '{"name":"Ada"}',
    status: "JSON converted to HTML",
    contains: ["name", "Ada"],
  },

  // JSON Tools
  {
    path: "/",
    branch: "JSON Tools",
    label: "Validate JSON",
    input: '{"a": 1}',
    status: "Valid JSON",
    exact: '{"a": 1}',
  },

  // String Functions
  {
    path: "/string-functions",
    branch: "String Functions",
    label: "String to Binary",
    input: "Hi",
    status: "String converted to binary",
    exact: "01001000 01101001",
  },
  {
    path: "/string-functions",
    branch: "String Functions",
    label: "Binary to String",
    input: "01001000 01101001",
    status: "Binary converted to string",
    exact: "Hi",
  },
  {
    path: "/string-functions",
    branch: "String Functions",
    label: "Remove Extra Spaces",
    input: "a  b   c",
    status: "Extra spaces removed",
    exact: "a b c",
  },
  {
    path: "/string-functions",
    branch: "String Functions",
    label: "Remove Line Breaks",
    input: "a\nb",
    status: "Line breaks removed",
    exact: "a b",
  },
  {
    path: "/string-functions",
    branch: "String Functions",
    label: "Word Sorter",
    input: "banana apple cherry",
    status: "Words sorted",
    exact: "apple\nbanana\ncherry",
  },

  // Cryptography
  { path: "/cryptography-tools", branch: "Cryptography", label: "MD5 Hash", input: "hello", status: "MD5 hash generated", exact: "5d41402abc4b2a76b9719d911017c592" },
  { path: "/cryptography-tools", branch: "Cryptography", label: "SHA-1 Hash", input: "hello", status: "SHA-1 hash generated", exact: "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d" },
  { path: "/cryptography-tools", branch: "Cryptography", label: "SHA-224 Hash", input: "hello", status: "SHA-224 hash generated", exact: "ea09ae9cc6768c50fcee903ed054556e5bfc8347907f12598aa24193" },
  { path: "/cryptography-tools", branch: "Cryptography", label: "SHA-256 Hash", input: "hello", status: "SHA-256 hash generated", exact: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824" },
  { path: "/cryptography-tools", branch: "Cryptography", label: "SHA-384 Hash", input: "hello", status: "SHA-384 hash generated", exact: "59e1748777448c69de6b800d7a33bbfb9ff1b463e44354c3553bcdb9c666fa90125a3c79f90397bdf5f6a13de828684f" },
  { path: "/cryptography-tools", branch: "Cryptography", label: "SHA-512 Hash", input: "hello", status: "SHA-512 hash generated", exact: "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043" },
  { path: "/cryptography-tools", branch: "Cryptography", label: "SHA-512/224 Hash", input: "hello", status: "SHA-512/224 hash generated", exact: "fe8509ed1fb7dcefc27e6ac1a80eddbec4cb3d2c6fe565244374061c" },
  { path: "/cryptography-tools", branch: "Cryptography", label: "SHA-512/256 Hash", input: "hello", status: "SHA-512/256 hash generated", exact: "e30d87cfa2a75db545eac4d61baf970366a8357c7f72fa95b52d0accb698f13a" },
  { path: "/cryptography-tools", branch: "Cryptography", label: "SHA3-224 Hash", input: "hello", status: "SHA3-224 hash generated", exact: "b87f88c72702fff1748e58b87e9141a42c0dbedc29a78cb0d4a5cd81" },
  { path: "/cryptography-tools", branch: "Cryptography", label: "SHA3-256 Hash", input: "hello", status: "SHA3-256 hash generated", exact: "3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392" },
  { path: "/cryptography-tools", branch: "Cryptography", label: "SHA3-384 Hash", input: "hello", status: "SHA3-384 hash generated", exact: "720aea11019ef06440fbf05d87aa24680a2153df3907b23631e7177ce620fa1330ff07c0fddee54699a4c3ee0ee9d887" },
  { path: "/cryptography-tools", branch: "Cryptography", label: "SHA3-512 Hash", input: "hello", status: "SHA3-512 hash generated", exact: "75d527c368f2efe848ecf6b073a36767800805e9eef2b1857d5f984f036eb6df891d75f72d9b154518c1cd58835286d1da9a38deba3de98b5a53e5ed78a84976" },

  // Random Tools — deterministic status, structure-only output checks
  { path: "/random-generators", branch: "Random Tools", label: "Random Time Generator", input: "3", status: "Random times generated", lines: (l) => /^\d{2}:\d{2}:\d{2}$/.test(l) },
  { path: "/random-generators", branch: "Random Tools", label: "Random XML Generator", input: "3", status: "Random XML generated", contains: ["<root>"] },
  { path: "/random-generators", branch: "Random Tools", label: "Random CSV Generator", input: "3", status: "Random CSV generated", lines: (l) => l.includes(",") },
  { path: "/random-generators", branch: "Random Tools", label: "Random Number Generator", input: "3", status: "Random numbers generated", lines: (l) => /^\d+\.\d{2,6}$/.test(l) },
  { path: "/random-generators", branch: "Random Tools", label: "Random Integer Generator", input: "3", status: "Random integers generated", lines: (l) => /^\d+$/.test(l) },
  { path: "/random-generators", branch: "Random Tools", label: "Random Prime Generator", input: "3", status: "Random primes generated", lines: (l) => /^\d+$/.test(l) && Number(l) > 1 },
  { path: "/random-generators", branch: "Random Tools", label: "Random Date Generator", input: "3", status: "Random dates generated", lines: (l) => /^\d{4}-\d{2}-\d{2}T/.test(l) },
  { path: "/random-generators", branch: "Random Tools", label: "Random Bitmap Generator", input: "3x3", status: "Random bitmap generated", lines: (l) => /^[01]{3}$/.test(l) },
  { path: "/random-generators", branch: "Random Tools", label: "MAC Address Generator", input: "3", status: "Random MAC addresses generated", lines: (l) => /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/.test(l) },
  { path: "/random-generators", branch: "Random Tools", label: "Random Hex Generator", input: "3", status: "Random hex generated", lines: (l) => /^[0-9a-f]{32}$/.test(l) },
  { path: "/random-generators", branch: "Random Tools", label: "Random TSV Generator", input: "3", status: "Random TSV generated", lines: (l) => l.includes("\t") },
  { path: "/random-generators", branch: "Random Tools", label: "Random String Generator", input: "3", status: "Random strings generated", lines: (l) => /^[A-Za-z]+$/.test(l) },
  { path: "/random-generators", branch: "Random Tools", label: "Random Fraction Generator", input: "3", status: "Random fractions generated", lines: (l) => /^\d+\/\d+$/.test(l) },
  {
    path: "/random-generators",
    branch: "Random Tools",
    label: "Random Integer Range Generator",
    input: "5 20",
    status: "Random integers generated in range",
    lines: (l) => /^\d+$/.test(l) && Number(l) >= 5 && Number(l) <= 20,
  },
  { path: "/random-generators", branch: "Random Tools", label: "Random Binary Generator", input: "3", status: "Random binary generated", lines: (l) => /^[01]+$/.test(l) },
  { path: "/random-generators", branch: "Random Tools", label: "Random Byte Generator", input: "3", status: "Random bytes generated", lines: (l) => /^\d+$/.test(l) && Number(l) >= 0 && Number(l) <= 255 },
  { path: "/random-generators", branch: "Random Tools", label: "Random Decimal Generator", input: "3 1 9", status: "Random decimals generated", lines: (l) => /^\d\.\d{6}$/.test(l) && Number(l) >= 1 && Number(l) <= 9 },
  { path: "/random-generators", branch: "Random Tools", label: "Random Alphanumeric Generator", input: "3", status: "Random alphanumeric strings generated", lines: (l) => /^[A-Za-z0-9]+$/.test(l) },
];

test.describe("workspace matrix — every tool input→output", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("devtools-thanks-shown", "1");
    });
  });

  for (const row of rows) {
    test(`[${row.branch}] ${row.label}`, async ({ page }) => {
      await page.goto(row.path);
      await selectTool(page, row.branch, row.label);
      await typeIntoEditor(page, row.input);

      await expect(page.getByRole("status")).toHaveText(row.status);

      if (row.exact != null) {
        expect((await editorText(page)).trim()).toBe(row.exact);
      } else if (row.lines) {
        checkLines(await editorText(page), row.lines);
      } else {
        for (const needle of row.contains ?? []) {
          await expect(page.locator(".cm-content").first()).toContainText(needle);
        }
      }
    });
  }

  test("[JSON Tools] Sort JSON Keys sorts nested keys via toolbar action", async ({ page }) => {
    await page.goto("/");
    await typeIntoEditor(page, '{"b":1,"a":{"d":2,"c":3}}');
    await page.getByRole("button", { name: "Sort Keys" }).click();
    await expect(page.getByRole("status")).toHaveText("JSON keys sorted recursively");
    const sorted = (await editorText(page)).trim();
    expect(sorted.indexOf('"a"')).toBeLessThan(sorted.indexOf('"b"'));
    expect(sorted.indexOf('"c"')).toBeLessThan(sorted.indexOf('"d"'));
  });
});