import { createBlogOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/blog/og-card";
import { BLOG_POSTS } from "@/lib/blog/registry";

export const alt = "Engineering Behind DataFormatter — the DataFormatter engineering blog";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createBlogOgImage({
    eyebrow: "DataFormatter Engineering Blog",
    title: "Engineering Behind DataFormatter",
    subtitle: `${BLOG_POSTS.length} source-accurate write-ups of how the tools actually work — JSON formats, API contracts, debugging, integer math, checksums and in-browser compilation.`,
  });
}