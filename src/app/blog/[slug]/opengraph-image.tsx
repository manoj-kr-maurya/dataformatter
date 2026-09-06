import { createBlogOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/blog/og-card";
import { getBlogPost } from "@/lib/blog/registry";

export const alt = "An engineering deep-dive from the DataFormatter blog";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getBlogPost(slug);

  return createBlogOgImage({
    eyebrow: article ? `${article.category} · ${article.readingTime} min read` : "DataFormatter Blog",
    title: article?.title ?? "Engineering Behind DataFormatter",
    subtitle:
      article?.excerpt ??
      "Source-accurate write-ups of how the DataFormatter developer tools actually work.",
  });
}