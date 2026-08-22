import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "DataFormatter — Online Developer Data Tools";

/** Shared branded social card, inherited by every route. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #09090b 0%, #27272a 100%)",
          color: "#f4f4f5",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#8b5cf6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 700,
            }}
          >
            {"{}"}
          </div>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>
            DataFormatter
          </div>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 36,
            color: "#a1a1aa",
            display: "flex",
          }}
        >
          Developer data tools that run in your browser
        </div>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 16,
            fontSize: 26,
            color: "#d4d4d8",
          }}
        >
          {["JSON", "Base64", "JWT", "URL", "Hash"].map((tool) => (
            <div
              key={tool}
              style={{
                padding: "8px 24px",
                borderRadius: 999,
                border: "1px solid #3f3f46",
                display: "flex",
              }}
            >
              {tool}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 44, fontSize: 24, color: "#71717a", display: "flex" }}>
          dataformatter.in — private by design
        </div>
      </div>
    ),
    { ...size },
  );
}
