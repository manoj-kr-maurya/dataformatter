import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

function parseUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

export function urlParser(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no URL to parse.", "UNKNOWN", "TEXT");
  }

  const url = parseUrl(trimmed);
  if (!url) {
    return failResult(
      input,
      "Invalid URL — provide a full URL such as https://example.com/path?q=1#top.",
      "TEXT",
      "TEXT",
    );
  }

  const lines: string[] = [
    `protocol: ${url.protocol}`,
    `hostname: ${url.hostname}`,
    `port: ${url.port || "(default)"}`,
    `path: ${url.pathname}`,
    `hash: ${url.hash || "(none)"}`,
  ];

  if (url.search) {
    const params = Array.from(url.searchParams.entries());
    lines.push(`query: ${url.search}`);
    lines.push("parameters:");
    params.forEach(([key, value]) => lines.push(`  ${key}: ${value}`));
  } else {
    lines.push("query: (none)");
  }

  return okResult(
    input,
    lines.join("\n"),
    "URL_PARSE",
    "TEXT",
    "URL parsed into its components",
    "TEXT",
  );
}
