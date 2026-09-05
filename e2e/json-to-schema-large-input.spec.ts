import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * JSON to Schema enterprise stress suite — every Schema format is exercised
 * with complex/large/enterprise-grade documents, and every generated line is
 * asserted against independently-constructed expectations (built from the
 * documented output grammar, not from the generator under test).
 *
 * Formats: JSON Schema, Zod schema, Pydantic model, OpenAPI schema, NestJS DTO,
 * Prisma schema
 * Scenarios: complex nested order, several-samples merging, array unions,
 * 26-level depth (flattening at depth 25), a 250-prop config, rename flow,
 * malformed-JSON error path.
 */

const MOD_OR_CTRL = process.platform === "darwin" ? "Meta" : "Control";

test.describe.configure({ timeout: 120_000 });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("devtools-thanks-shown", "1");
  });
});

/** Type into a CodeMirror editor identified by its aria-label. */
async function typeIn(page: Page, target: Locator, text: string) {
  await target.click();
  await page.keyboard.press(`${MOD_OR_CTRL}+A`);
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(text);
}

/** Stat chip renders `<value><label>` in one element (e.g. "10props"). */
function statChip(page: Page, label: string, value: string): Locator {
  return page.getByText(`${value}${label}`, { exact: true }).first();
}

/** Assert a whitespace-normalized substring appears in the output `<pre>`. */
async function assertContains(pre: Locator, frag: string) {
  await expect(pre).toContainText(frag.replace(/\s+/g, " ").trim());
}

async function loadOrder(page: Page) {
  await page.goto("/json-to-schema");
  await typeIn(page, page.getByLabel("JSON input for schema generation"), JSON.stringify(ENTERPRISE_ORDER));
  await page.getByLabel("Model name").fill("Order");
  await expect(page.getByText("10props", { exact: true })).toBeVisible();
}

function switchFormat(page: Page, label: string) {
  return page.getByRole("button", { name: label, exact: true }).click();
}

// ── Shared fixtures ─────────────────────────────────────────────────────────

const ENTERPRISE_ORDER = {
  id: "7a7f2f2f-2d4b-4c1a-9f4e-9c8b7a6f5e4d",
  contactEmail: "billing@example.com",
  customer: {
    email: "ada@example.com",
    profileUrl: "https://example.com/ada",
    memberSince: "2021-06-01",
    loyaltyPoints: 1250,
    riskScore: 0.42,
    active: true,
  },
  billing: {
    address: { street: "1 Market St", city: "San Francisco", zip: "94103" },
    primary: true,
  },
  lineItems: [
    { sku: "SKU-1001", quantity: 2, unitPrice: 19.99, taxable: true, tags: ["electronics", "gift"] },
    { sku: "SKU-1002", quantity: 1, unitPrice: 5.0, taxable: false, tags: ["packaging"] },
  ],
  shippedAt: "2026-09-02T14:33:00Z",
  trackingUrl: "https://logistics.example.com/7a7f",
  total: 44.98,
  currency: "USD",
  notes: null,
};

const REQUIRED_ROOT = '"required": [ "id", "contactEmail", "customer", "billing", "lineItems", "shippedAt", "trackingUrl", "total", "currency", "notes" ]';

const SAMPLE_ROWS = [
  { id: 1, sku: "A", price: 9.99, inStock: true, supplier: "acme", shelf: "A1" },
  { id: 2, sku: "B", price: 19.99, inStock: false },
  { id: 3, sku: "C", price: 2.5, inStock: true, supplier: "globex", location: "DC1" },
];

function buildLargeConfig(): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  for (let i = 0; i < 250; i += 1) {
    const mod = i % 4;
    config[`f${String(i).padStart(3, "0")}`] = mod === 0 ? `str-${i}` : mod === 1 ? i : mod === 2 ? i % 2 === 0 : i * 1.5;
  }
  return config;
}

function buildDeep(): Record<string, unknown> {
  let value: Record<string, unknown> = { a: "leaf" };
  for (let i = 0; i < 25; i += 1) value = { a: value };
  return value;
}

// ── Each Schema format on a complex enterprise order ───────────────────────

test("JSON Schema format — complex enterprise order", async ({ page }) => {
  await loadOrder(page);
  await expect(page.getByRole("heading", { name: "Generated JSON Schema", exact: true })).toBeVisible();
  const pre = page.locator("pre").first();
  await assertContains(pre, '"$schema": "https://json-schema.org/draft/2020-12/schema"');
  await assertContains(pre, '"title": "Order"');
  await assertContains(pre, '"id": { "type": "string", "format": "uuid" }');
  await assertContains(pre, '"contactEmail": { "type": "string", "format": "email" }');
  await assertContains(pre, '"profileUrl": { "type": "string", "format": "uri" }');
  await assertContains(pre, '"memberSince": { "type": "string", "format": "date" }');
  await assertContains(pre, '"shippedAt": { "type": "string", "format": "date-time" }');
  await assertContains(pre, '"trackingUrl": { "type": "string", "format": "uri" }');
  await assertContains(pre, '"loyaltyPoints": { "type": "integer" }');
  await assertContains(pre, '"riskScore": { "type": "number" }');
  await assertContains(pre, '"notes": { "type": [ "null" ] }');
  await assertContains(pre, '"lineItems": { "type": "array", "items": { "type": "object", "properties": {');
  await assertContains(pre, '"quantity": { "type": "integer" }');
  await assertContains(pre, '"taxable": { "type": "string" }');
  await assertContains(pre, '"tags": { "type": "array", "items": { "type": "string" } }');
  await assertContains(pre, REQUIRED_ROOT);
  await expect(statChip(page, "props", "10")).toBeVisible();
  await expect(statChip(page, "root", "object")).toBeVisible();
  await expect(statChip(page, "format hints", "7")).toBeVisible();
});

test("Zod schema format — complex enterprise order", async ({ page }) => {
  await loadOrder(page);
  await switchFormat(page, "Zod schema");
  await expect(page.getByRole("heading", { name: "Generated Zod schema", exact: true })).toBeVisible();
  const pre = page.locator("pre").first();
  await assertContains(pre, 'import { z } from "zod";');
  await assertContains(pre, "export const OrderSchema = z.object({");
  await assertContains(pre, "export type Order = z.infer<typeof OrderSchema>;");
  await assertContains(pre, "id: z.string().uuid(),");
  await assertContains(pre, "contactEmail: z.string().email(),");
  await assertContains(pre, "memberSince: z.string().datetime(),");
  await assertContains(pre, "loyaltyPoints: z.number().int(),");
  await assertContains(pre, "riskScore: z.number(),");
  await assertContains(pre, "active: z.boolean() }),");
  await assertContains(pre, "lineItems: z.array(z.object({");
  await assertContains(pre, "quantity: z.number().int(),");
  await assertContains(pre, "tags: z.array(z.string()) })),");
  await assertContains(pre, "shippedAt: z.string().datetime(),");
  await assertContains(pre, "notes: z.null() });");
});

test("Pydantic model format — complex enterprise order", async ({ page }) => {
  await loadOrder(page);
  await switchFormat(page, "Pydantic model");
  await expect(page.getByRole("heading", { name: "Generated Pydantic model", exact: true })).toBeVisible();
  const pre = page.locator("pre").first();
  await assertContains(pre, "from pydantic import BaseModel");
  await assertContains(pre, "class Order(BaseModel):");
  await assertContains(pre, "id: str");
  await assertContains(pre, "contactEmail: str");
  await assertContains(pre, "customer: dict[str, object]");
  await assertContains(pre, "lineItems: list[dict[str, object]]");
  await assertContains(pre, "total: float");
  await assertContains(pre, "notes: None");
});

test("Prisma schema format — complex enterprise order", async ({ page }) => {
  await loadOrder(page);
  await switchFormat(page, "Prisma schema");
  await expect(page.getByRole("heading", { name: "Generated Prisma schema", exact: true })).toBeVisible();
  const pre = page.locator("pre").first();
  await assertContains(pre, "model Order {");
  await assertContains(pre, "id  String");
  await assertContains(pre, "contactEmail  String");
  await assertContains(pre, "customer  Json");
  await assertContains(pre, "billing  Json");
  await assertContains(pre, "lineItems  Json");
  await assertContains(pre, "shippedAt  String");
  await assertContains(pre, "total  Float");
  await assertContains(pre, "currency  String");
  await assertContains(pre, "notes  Json");
});

test("Format button prettifies valid JSON to 2-space indentation", async ({ page }) => {
  await page.goto("/json-to-schema");
  const input = page.getByLabel("JSON input for schema generation");
  await typeIn(page, input, '{"a":1,"b":[true,null],"c":{"d":"x"}}');
  await expect(page.locator(".cm-line")).toHaveCount(1);
  await page.getByRole("button", { name: "Format", exact: true }).click();
  await expect(page.locator(".cm-line")).toHaveCount(10);
  await expect(input.locator(".cm-line").first()).toContainText("{");
  await expect(page.getByText("3props", { exact: true })).toBeVisible();
});

test("word wrap is on by default and the toggle persists", async ({ page }) => {
  await page.goto("/json-to-schema");
  const wrap = page.getByRole("button", { name: "Wrap", exact: true });
  await expect(wrap).toHaveAttribute("aria-pressed", "true");
  await wrap.click();
  await expect(wrap).toHaveAttribute("aria-pressed", "false");
  await wrap.click();
  await expect(wrap).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Wrap", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("OpenAPI schema format — complex enterprise order", async ({ page }) => {
  await loadOrder(page);
  await switchFormat(page, "OpenAPI schema");
  await expect(page.getByRole("heading", { name: "Generated OpenAPI schema", exact: true })).toBeVisible();
  const pre = page.locator("pre").first();
  await assertContains(pre, "# Component schema for OpenAPI 3.x — reference as:");
  await assertContains(pre, "# components.schemas.Order");
  await assertContains(pre, "Order:");
  await assertContains(pre, '"format": "uuid"');
  await assertContains(pre, '"format": "email"');
  await assertContains(pre, '"type": "array"');
  await assertContains(pre, REQUIRED_ROOT);
});

test("NestJS DTO format — complex enterprise order", async ({ page }) => {
  await loadOrder(page);
  await switchFormat(page, "NestJS DTO");
  await expect(page.getByRole("heading", { name: "Generated NestJS DTO", exact: true })).toBeVisible();
  const pre = page.locator("pre").first();
  await assertContains(pre, 'import { ApiProperty } from "@nestjs/swagger";');
  await assertContains(pre, "export class OrderDto {");
  await assertContains(pre, "@ApiProperty() @IsEmail() readonly contactEmail: string;");
  await assertContains(pre, "@ApiProperty() @IsObject() readonly customer: Record<string, unknown>;");
  await assertContains(pre, "@ApiProperty() @IsArray() readonly lineItems: Record<string, unknown>[];");
  await assertContains(pre, "@ApiProperty() @IsOptional() readonly notes: string;");
  await assertContains(pre, "@ApiProperty() @IsNumber() readonly total: number;");
});

// ── Several-samples merging (root array of objects) ────────────────────────

test("several samples — object merge produces optional fields", async ({ page }) => {
  await page.goto("/json-to-schema");
  await typeIn(page, page.getByLabel("JSON input for schema generation"), JSON.stringify(SAMPLE_ROWS));
  await page.getByLabel("Model name").fill("Product");
  await expect(page.getByText("7props", { exact: true })).toBeVisible();
  const pre = page.locator("pre").first();
  await assertContains(pre, '"required": [ "id", "sku", "price", "inStock", "supplier" ]');

  await switchFormat(page, "Zod schema");
  await assertContains(pre, "supplier: z.string(),");
  await assertContains(pre, "shelf: z.string().optional(),");
  await assertContains(pre, "location: z.string().optional() });");

  await switchFormat(page, "Pydantic model");
  await assertContains(pre, "supplier: str");
  await assertContains(pre, "shelf: str | None = None");

  await switchFormat(page, "NestJS DTO");
  await assertContains(pre, "readonly supplier: string;");
  await assertContains(pre, "readonly shelf: string?;");

  await switchFormat(page, "Prisma schema");
  await assertContains(pre, "model Product {");
  await assertContains(pre, "supplier  String");
  await assertContains(pre, "shelf  String?");
  await assertContains(pre, "location  String?");
});

// ── Array unions — scalar coercion inside array items ──────────────────────

test("array unions — integer/number/string/empty coercion", async ({ page }) => {
  const doc = { ints: [1, 2, 3], numbers: [1, 2.5], scalars: [1, "x"], booleans: [true, "x"], empty: [] };
  await page.goto("/json-to-schema");
  await typeIn(page, page.getByLabel("JSON input for schema generation"), JSON.stringify(doc));
  await page.getByLabel("Model name").fill("Box");
  const pre = page.locator("pre").first();
  await assertContains(pre, '"ints": { "type": "array", "items": { "type": "integer" } }');
  await assertContains(pre, '"numbers": { "type": "array", "items": { "type": "number" } }');
  await assertContains(pre, '"scalars": { "type": "array", "items": { "type": "integer" } }');
  await assertContains(pre, '"booleans": { "type": "array", "items": { "type": "string" } }');
  await assertContains(pre, '"empty": { "type": "array", "items": { "type": "string" } }');

  await switchFormat(page, "Prisma schema");
  await assertContains(pre, "model Box {");
  await assertContains(pre, "ints  Int[]");
  await assertContains(pre, "numbers  Float[]");
  await assertContains(pre, "scalars  Int[]");
  await assertContains(pre, "booleans  String[]");
  await assertContains(pre, "empty  String[]");
});

// ── Depth-26 nesting flattens to a string at depth 25 ──────────────────────

test("26-level nesting — depth guard flattens to string", async ({ page }) => {
  await page.goto("/json-to-schema");
  await typeIn(page, page.getByLabel("JSON input for schema generation"), JSON.stringify(buildDeep()));
  await page.getByLabel("Model name").fill("Deep");
  const pre = page.locator("pre").first();
  await assertContains(pre, '"type": "object"');
  await assertContains(pre, '"a": { "type": "string" }');
  await expect(page.getByText("1props", { exact: true })).toBeVisible();
  await expect(page.getByText("objectroot", { exact: true })).toBeVisible();
});

// ── Large enterprise config — 250 props in every format ────────────────────

test("large 250-prop config — renders at scale in every format", async ({ page }) => {
  await page.goto("/json-to-schema");
  await typeIn(page, page.getByLabel("JSON input for schema generation"), JSON.stringify(buildLargeConfig()));
  await page.getByLabel("Model name").fill("AppConfig");
  await expect(statChip(page, "props", "250")).toBeVisible();

  const pre = page.locator("pre").first();
  await assertContains(pre, '"title": "AppConfig"');
  await assertContains(pre, '"f000": { "type": "string" }');
  await assertContains(pre, '"f249": { "type": "integer" }');

  await switchFormat(page, "Zod schema");
  await assertContains(pre, "export const AppConfigSchema = z.object({");
  await assertContains(pre, "f000: z.string(),");
  await assertContains(pre, "f246: z.boolean(),");
  await assertContains(pre, "f249: z.number().int() });");

  await switchFormat(page, "Pydantic model");
  await assertContains(pre, "class AppConfig(BaseModel):");
  await assertContains(pre, "f000: str");
  await assertContains(pre, "f249: int");

  await switchFormat(page, "OpenAPI schema");
  await assertContains(pre, "AppConfig:");
  await assertContains(pre, '"f249": { "type": "integer" }');

  await switchFormat(page, "NestJS DTO");
  await assertContains(pre, "export class AppConfigDto {");
  await assertContains(pre, "readonly f000: string;");
  await assertContains(pre, "readonly f249: number;");
});

// ── Model-name rename flows into every format ──────────────────────────────

test("Model name rename propagates to all five formats", async ({ page }) => {
  await loadOrder(page);
  await page.getByLabel("Model name").fill("Invoice");
  const pre = page.locator("pre").first();
  await assertContains(pre, '"title": "Invoice"');

  await switchFormat(page, "Zod schema");
  await assertContains(pre, "export const InvoiceSchema = z.object({");
  await assertContains(pre, "export type Invoice = z.infer<typeof InvoiceSchema>;");

  await switchFormat(page, "Pydantic model");
  await assertContains(pre, "class Invoice(BaseModel):");

  await switchFormat(page, "OpenAPI schema");
  await assertContains(pre, "# components.schemas.Invoice");
  await assertContains(pre, "Invoice:");

  await switchFormat(page, "NestJS DTO");
  await assertContains(pre, "export class InvoiceDto {");
});

// ── Error path — malformed JSON ────────────────────────────────────────────

test("malformed JSON surfaces a parse error instead of a schema", async ({ page }) => {
  await page.goto("/json-to-schema");
  await typeIn(page, page.getByLabel("JSON input for schema generation"), `{"broken": tru`);
  await expect(page.getByText(/not valid JSON|Unexpected token|Unexpected end/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Generated JSON Schema", exact: true })).toBeVisible();
});