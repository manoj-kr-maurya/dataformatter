import { ImageResponse } from "next/og";

/** Standard social-card geometry — 1200×630 as required by OG consumers. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Branded per-tool social card: tool name front and center, a one-line
 * tagline, and the site brand. Rendered with Satori (flex-only styles) and
 * statically prerendered at build time by each route's opengraph-image file.
 */
export function createToolOgImage(alt: string, title: string, tagline: string) {
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

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2, display: "flex" }}>
            {title}
          </div>
          <div style={{ marginTop: 18, fontSize: 36, color: "#a1a1aa", display: "flex" }}>
            {tagline}
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
          <div style={{ display: "flex" }}>dataformatter.in</div>
          <div style={{ display: "flex" }}>Free · No signup · Runs in your browser</div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
