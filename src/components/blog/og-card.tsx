import { ImageResponse } from "next/og";

/** Standard social-card geometry — 1200×630 as required by OG consumers. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

interface BlogOgImageProps {
  /** Category chip text shown above the title (e.g. "Data Formats · Article"). */
  eyebrow: string;
  /** Article or hub title — wraps across the full width, so long titles fit. */
  title: string;
  /** Primary excerpt or hub tagline. */
  subtitle: string;
}

/**
 * Branded blog social card: category eyebrow, wrapping title, excerpt and the
 * site brand. Uses the same palette and geometry as the tool cards so shared
 * blog links are recognizably DataFormatter. Rendered with Satori (flex-only
 * styles) and statically prerendered at build time by each route's
 * opengraph-image file.
 */
export function createBlogOgImage({ eyebrow, title, subtitle }: BlogOgImageProps) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #09090b 0%, #27272a 100%)",
          color: "#f4f4f5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "#8b5cf6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                fontWeight: 700,
              }}
            >
              {"{}"}
            </div>
            <div style={{ fontSize: 30, fontWeight: 600, color: "#d4d4d8", display: "flex" }}>
              DataFormatter
            </div>
          </div>
          <div
            style={{
              marginTop: 0,
              padding: "10px 22px",
              borderRadius: 999,
              border: "1px solid #3f3f46",
              fontSize: 24,
              color: "#a1a1aa",
              display: "flex",
            }}
          >
            Blog
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, fontWeight: 600, color: "#a78bfa", display: "flex" }}>
            {eyebrow}
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 54,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.12,
              display: "flex",
              flexWrap: "wrap",
              maxWidth: 1056,
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 28,
              color: "#a1a1aa",
              lineHeight: 1.4,
              display: "flex",
              flexWrap: "wrap",
              maxWidth: 1056,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 26,
            color: "#71717a",
          }}
        >
          <div style={{ display: "flex" }}>dataformatter.in/blog</div>
          <div style={{ display: "flex" }}>Free · No signup · Runs in your browser</div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}