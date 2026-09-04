import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import {
  BREADCRUMBS,
  FOOTER_LINKS,
  GEO_ANSWERS,
  HEADER_LINKS,
  RELATED_LINKS,
  SEO_PAGES,
  SITE_NAME,
  SITE_URL,
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  serializeJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo";

const pages = Array.from(SEO_PAGES.values());

describe("SEO registry", () => {
  it("has unique titles, descriptions and H1s across all indexable pages", () => {
    const titles = new Set(pages.map((p) => p.title));
    const descriptions = new Set(pages.map((p) => p.description));
    const h1s = new Set(pages.map((p) => p.h1));
    expect(titles.size).toBe(pages.length);
    expect(descriptions.size).toBe(pages.length);
    expect(h1s.size).toBe(pages.length);
  });

  it("gives every page sane title and description lengths", () => {
    for (const page of pages) {
      expect(page.title.length, page.path).toBeGreaterThan(10);
      // Legacy SERP titles are preserved verbatim (they are already indexed),
      // so this is a loose guard against runaway titles, not a strict limit.
      expect(page.title.length + ` | ${SITE_NAME}`.length, page.path).toBeLessThanOrEqual(100);
      expect(page.description.length, page.path).toBeGreaterThanOrEqual(50);
      expect(page.description.length, page.path).toBeLessThanOrEqual(400);
    }
  });

  it("uses canonical paths starting with / and never exposes share payloads", () => {
    for (const page of pages) {
      expect(page.path.startsWith("/")).toBe(true);
      expect(page.path.includes("#"), page.path).toBe(false);
      expect(page.path.includes("?"), page.path).toBe(false);
    }
  });

  it("covers the high-intent tool keywords with dedicated landing pages", () => {
    for (const path of [
      "/json-formatter",
      "/json-minifier",
      "/json-validator",
      "/base64-encoder",
      "/base64-decoder",
      "/jwt-decoder",
      "/url-encoder",
      "/url-decoder",
      "/hash-generator",
    ]) {
      expect(SEO_PAGES.has(path), `${path} missing`).toBe(true);
    }
  });
});

describe("buildMetadata", () => {
  it("returns a self-canonical, complete metadata object per page", () => {
    for (const page of pages) {
      const meta = buildMetadata(page.path);
      expect(meta.alternates?.canonical).toBe(page.path);
      expect(meta.title).toBe(page.title);
      expect(meta.description).toBe(page.description);
      expect((meta.openGraph as { url: string }).url).toBe(page.path);
      expect((meta.openGraph as { siteName: string }).siteName).toBe(SITE_NAME);
      expect((meta.twitter as { card: string }).card).toBe("summary_large_image");
      // Indexability comes from the layout defaults — never overridden here.
      expect(meta).not.toHaveProperty("robots");
    }
  });

  it("rejects unknown paths", () => {
    expect(() => buildMetadata("/nope")).toThrow();
  });
});

describe("sitemap", () => {
  const entries = sitemap();

  it("lists exactly the registered canonical URLs", () => {
    expect(entries).toHaveLength(SEO_PAGES.size);
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain(`${SITE_URL}/`);
    for (const page of pages) {
      if (page.path === "/") continue;
      expect(urls).toContain(`${SITE_URL}${page.path}`);
    }
  });

  it("never contains share payloads, query strings or fragments", () => {
    for (const entry of entries) {
      expect(entry.url.includes("#")).toBe(false);
      expect(entry.url.includes("?")).toBe(false);
      expect(entry.url.toLowerCase().includes("share")).toBe(false);
    }
  });
});

describe("robots", () => {
  it("allows crawlers everywhere and declares the sitemap", () => {
    const rules = robots();
    expect(rules.rules).toMatchObject({ userAgent: "*", allow: "/" });
    expect(rules.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});

describe("internal link graph", () => {
  it("only links between registered routes", () => {
    const valid = new Set(SEO_PAGES.keys());
    for (const links of Object.values(RELATED_LINKS)) {
      for (const link of links) {
        expect(valid.has(link.href), `related href ${link.href} is not a registered page`).toBe(
          true,
        );
        expect(link.label.length).toBeGreaterThan(2); // descriptive anchors only
      }
    }
    for (const links of [HEADER_LINKS, FOOTER_LINKS]) {
      for (const link of links) {
        expect(valid.has(link.href), `nav href ${link.href} is not a registered page`).toBe(true);
      }
    }
  });

  it("gives every landing page related-tool links (no orphans)", () => {
    for (const page of pages) {
      if (page.path === "/") return;
      expect(RELATED_LINKS[page.path]?.length ?? 0, page.path).toBeGreaterThan(0);
    }
  });
});

describe("breadcrumbs", () => {
  it("covers every registered page with a trail ending at itself", () => {
    for (const page of pages) {
      const trail = BREADCRUMBS[page.path];
      expect(trail, page.path).toBeDefined();
      expect(trail[0]).toEqual({ name: "Home", href: "/" });
      const last = trail[trail.length - 1];
      expect(last.href, page.path).toBe(page.path);
    }
  });

  it("only references registered routes in trails", () => {
    for (const trail of Object.values(BREADCRUMBS)) {
      for (const item of trail) {
        expect(SEO_PAGES.has(item.href), item.href).toBe(true);
      }
    }
  });

  it("produces BreadcrumbList markup with absolute URLs and 1-based positions", () => {
    const json = breadcrumbJsonLd("/url-encoder");
    expect(json["@type"]).toBe("BreadcrumbList");
    expect(json.itemListElement[0].item).toBe(`${SITE_URL}/`);
    json.itemListElement.forEach((entry: { position: number }, i: number) => {
      expect(entry.position).toBe(i + 1);
    });
  });
});

describe("SoftwareApplication structured data", () => {
  it("marks each page up as a free developer web application", () => {
    for (const page of pages) {
      if (page.path === "/") continue;
      const json = softwareApplicationJsonLd(page);
      expect(json["@type"]).toBe("SoftwareApplication");
      expect(json.applicationCategory).toBe("DeveloperApplication");
      expect(json.url).toBe(`${SITE_URL}${page.path}`);
      expect(json.offers.price).toBe("0");
    }
  });
});

describe("GEO answers", () => {
  // Every tool page (all registered pages except home/about/contact) must carry
  // a concise, complete GEO answer block so AI systems and featured snippets
  // can answer what / who-for / differentiator directly from the page.
  const NON_TOOL = new Set(["/", "/about", "/contact"]);

  it("covers every tool page with a complete GEO answer", () => {
    for (const page of pages) {
      if (NON_TOOL.has(page.path)) continue;
      const geo = GEO_ANSWERS[page.path];
      expect(geo, `${page.path} missing GEO answers`).toBeDefined();
      expect(geo.what.length, page.path).toBeGreaterThan(40);
      expect(geo.who.length, page.path).toBeGreaterThan(20);
      expect(geo.different.length, page.path).toBeGreaterThan(20);
    }
  });

  it("does not invent GEO answers for non-tool pages", () => {
    for (const path of NON_TOOL) {
      expect(GEO_ANSWERS[path]).toBeUndefined();
    }
  });

  it("only references registered routes", () => {
    const valid = new Set(SEO_PAGES.keys());
    for (const path of Object.keys(GEO_ANSWERS)) {
      expect(valid.has(path), path).toBe(true);
    }
  });
});

describe("structured data", () => {
  it("produces valid, serializable FAQPage markup matching visible content", () => {
    const items = [
      { q: "Is this free?", a: "Yes." },
      { q: "Private?", a: "Runs in your browser." },
    ];
    const json = JSON.parse(serializeJsonLd(faqJsonLd(items)));
    expect(json["@type"]).toBe("FAQPage");
    expect(json.mainEntity).toHaveLength(items.length);
    expect(json.mainEntity[0].name).toBe(items[0].q);
    expect(json.mainEntity[0].acceptedAnswer.text).toBe(items[0].a);
  });

  it("escapes markup so user-derived text can never break out of the LD+JSON tag", () => {
    const hostile = [{ q: "Q", a: 'evil </script><script>alert(1)</script> & "quotes"' }];
    const serialized = serializeJsonLd(faqJsonLd(hostile));
    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<script>");
    expect(serialized).not.toContain("&");
    // Round-trips back to the original data after parsing.
    const parsed = JSON.parse(serialized);
    expect(parsed.mainEntity[0].acceptedAnswer.text).toBe(hostile[0].a);
  });
});
