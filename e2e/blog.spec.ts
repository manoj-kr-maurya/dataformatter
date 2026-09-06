import { expect, test, type Page } from "@playwright/test";

const ARTICLES = [
  "how-json-formatter-works",
  "how-json-diff-works",
  "signed-vs-unsigned-integers",
  "twos-complement-explained",
  "crc32-explained",
  "what-makes-an-api-change-breaking",
  "how-to-read-a-stack-trace",
  "http-headers-developers-should-know",
  "openapi-3-0-vs-3-1",
  "running-code-in-the-browser",
];

const FULL_SITE_URL = "https://www.dataformatter.in";

async function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

function jsonLdTypes(page: Page): Promise<string[]> {
  return page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) =>
      scripts.flatMap((s) => {
        try {
          const data = JSON.parse(s.textContent ?? "");
          return Array.isArray(data) ? data.map((d) => d["@type"]) : [data["@type"]];
        } catch {
          return [];
        }
      }),
    );
}

test.describe("blog hub", () => {
  test("renders the hero, every article card, ItemList data and the footer entry", async ({
    page,
  }) => {
    const errors = await trackErrors(page);
    await page.goto("/blog");

    await expect(page.getByRole("heading", { name: "Engineering Behind DataFormatter" })).toBeVisible();
    for (const slug of ARTICLES) {
      await expect(page.locator(`a[href="/blog/${slug}"]`)).toBeVisible();
    }

    const types = await jsonLdTypes(page);
    expect(types).toContain("ItemList");
    expect(types).toContain("BreadcrumbList");

    const footerBlog = page.locator('footer a[href="/blog"]');
    await expect(footerBlog).toBeVisible();
    await expect(footerBlog).toHaveText("Blog");

    await expect(page).toHaveTitle(/Blog – Engineering.* \| DataFormatter$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${FULL_SITE_URL}/blog`,
    );
    expect(errors).toEqual([]);
  });

  test("filters articles by category without leaving the page", async ({ page }) => {
    await page.goto("/blog");

    const cards = page.locator("a[href^='/blog/']");
    await expect(cards).toHaveCount(ARTICLES.length);

    const filter = page.getByRole("button", { name: /^Data Formats \(\d+\)$/ });
    await filter.click();
    await expect(cards).toHaveCount(2);
    await expect(page.locator('a[href="/blog/how-json-formatter-works"]')).toBeVisible();
    await expect(page.locator('a[href="/blog/crc32-explained"]')).toHaveCount(0);

    await page.getByRole("button", { name: /^All \(\d+\)$/ }).click();
    await expect(cards).toHaveCount(ARTICLES.length);
  });
});

test.describe("blog articles", () => {
  test("every article renders structured data, breadcrumbs, TOC and valid links", async ({
    page,
  }) => {
    for (const slug of ARTICLES) {
      const errors = await trackErrors(page);
      const response = await page.goto(`/blog/${slug}`);
      expect(response?.status()).toBe(200);

      await expect(page.locator("main article h1")).toBeVisible();
      await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();

      const types = await jsonLdTypes(page);
      expect(types, `missing BlogPosting on ${slug}`).toContain("BlogPosting");
      expect(types, `missing BreadcrumbList on ${slug}`).toContain("BreadcrumbList");
      expect(types, `missing FAQPage on ${slug}`).toContain("FAQPage");

      // Every article exposes an anchor TOC and an answer-first summary.
      await expect(page.locator('nav[aria-label="On this page"]')).toBeVisible();
      await expect(page.getByRole("heading", { name: "In brief" })).toBeVisible();

      // Related-article links point at real article slugs.
      const relatedHrefs = await page
        .locator('section:has(h2:has-text("Related articles")) a[href^="/blog/"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
      expect(relatedHrefs.length, `${slug} has related articles`).toBeGreaterThan(0);
      for (const href of relatedHrefs) {
        const relatedSlug = href!.replace("/blog/", "");
        expect(ARTICLES, `${slug} related link ${href}`).toContain(relatedSlug);
      }

      // Related-tool cards link into canonical tool routes.
      const toolHrefs = await page
        .locator('section:has(h2:has-text("Try it yourself")) a[href]')
        .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
      expect(toolHrefs.length, `${slug} has tool links`).toBeGreaterThan(0);
      for (const href of toolHrefs) {
        expect(href, `${slug} tool link`).toMatch(/^\/[a-z0-9-]+$/);
      }

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${FULL_SITE_URL}/blog/${slug}`,
      );
      expect(errors, `${slug} had browser errors`).toEqual([]);
    }
  });

  test("the deep link navigates back to the hub via breadcrumbs", async ({ page }) => {
    await page.goto("/blog/how-json-diff-works");
    await page.locator('nav[aria-label="Breadcrumb"] a[href="/blog"]').click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(
      page.getByRole("heading", { name: "Engineering Behind DataFormatter" }),
    ).toBeVisible();
  });

  test("unknown slugs return 404 instead of a generated page", async ({ page }) => {
    const response = await page.goto("/blog/this-article-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});

test.describe("blog metadata", () => {
  test("sitemap.xml lists the hub and every article", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain(`<loc>${FULL_SITE_URL}/blog</loc>`);
    for (const slug of ARTICLES) {
      expect(body).toContain(`<loc>${FULL_SITE_URL}/blog/${slug}</loc>`);
    }
  });

  test("every article page links to the RSS feed via <link rel=alternate>", async ({ request }) => {
    const res = await request.get("/blog/how-json-formatter-works");
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain(
      `<link rel="alternate" type="application/rss+xml" href="${FULL_SITE_URL}/blog/rss.xml"/>`,
    );
  });
});

test.describe("blog social images", () => {
  test("the hub exposes a static PNG opengraph image", async ({ request }) => {
    const res = await request.get("/blog/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/^image\/png/);
  });

  test("every article exposes a static PNG opengraph image", async ({ request }) => {
    for (const slug of ARTICLES) {
      const res = await request.get(`/blog/${slug}/opengraph-image`);
      expect(res.status(), slug).toBe(200);
      expect(res.headers()["content-type"], slug).toMatch(/^image\/png/);
    }
  });
});

test.describe("blog RSS feed", () => {
  test("serves an RSS 2.0 document with the hub link and every article", async ({ request }) => {
    const res = await request.get("/blog/rss.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/^application\/rss\+xml/);
    const body = await res.text();
    expect(body).toContain(`<link>${FULL_SITE_URL}/blog</link>`);
    for (const slug of ARTICLES) {
      expect(body, slug).toContain(`<link>${FULL_SITE_URL}/blog/${slug}</link>`);
      expect(body, slug).toContain(`<guid isPermaLink="true">${FULL_SITE_URL}/blog/${slug}</guid>`);
    }
  });
});