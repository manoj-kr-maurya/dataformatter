import { BlogShell } from "@/components/blog/blog-shell";
import { BlogIndex } from "@/components/blog/blog-index";
import { Breadcrumbs } from "@/components/seo/content-blocks";
import { serializeJsonLd } from "@/lib/seo";
import {
  BLOG_POSTS,
  blogBreadcrumbJsonLd,
  blogItemListJsonLd,
  buildBlogMetadata,
} from "@/lib/blog/registry";

export const metadata = buildBlogMetadata();

export default function BlogHub() {
  return (
    <BlogShell activeHref="/blog">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogItemListJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogBreadcrumbJsonLd()) }}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
        ]}
      />
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
        Blog
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Engineering Behind DataFormatter
      </h1>
      <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        Source-accurate write-ups of how the DataFormatter developer tools actually work under the
        hood — data formats, API contracts, debugging, integer math, checksums and in-browser
        compilation. Every claim is verified against the implementation that ships on this site.
      </p>
      <BlogIndex articles={BLOG_POSTS} />
    </BlogShell>
  );
}