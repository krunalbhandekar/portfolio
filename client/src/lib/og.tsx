import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared share-card design (portfolio.md §4 #8): dark, accent bar, mono eyebrow. */
export function renderOgImage({
  eyebrow,
  title,
  subtitle,
  footer,
  accent,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  footer: string;
  accent: string;
}) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: "#0a0a0a",
        backgroundImage:
          "radial-gradient(circle at 85% 0%, rgba(255,255,255,0.08), transparent 45%)",
        color: "#fafafa",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 14, height: 14, borderRadius: 999, background: accent }} />
        <div
          style={{ fontSize: 26, color: "#a1a1aa", letterSpacing: 4, textTransform: "uppercase" }}
        >
          {eyebrow}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: title.length > 40 ? 64 : 80,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 32, color: "#a1a1aa", lineHeight: 1.3 }}>{subtitle}</div>
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 26,
          color: "#a1a1aa",
        }}
      >
        <span>{footer}</span>
        <div style={{ width: 160, height: 6, borderRadius: 999, background: accent }} />
      </div>
    </div>,
    OG_SIZE,
  );
}
