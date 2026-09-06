import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticlePage } from "@/components/blog/article-page";
import { BLOG_POSTS, buildBlogMetadata, getBlogPost } from "@/lib/blog/registry";

type BlogPostParams = Promise<{ slug: string }>;

export const dynamicParams = false;

export async function generateStaticParams() {
  return BLOG_POSTS.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: BlogPostParams }): Promise<Metadata> {
  const { slug } = await params;
  return buildBlogMetadata(slug);
}

export default async function BlogPost({ params }: { params: BlogPostParams }) {
  const { slug } = await params;
  const article = getBlogPost(slug);
  if (!article) {
    notFound();
  }
  return <BlogArticlePage article={article} />;
}