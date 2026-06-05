import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/constants";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

type OgCardProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  price?: string;
};

export function buildOgImage(props: OgCardProps) {
  const { eyebrow = SITE_NAME, title, subtitle, price } = props;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          padding: 64,
        }}
      >
        <div
          style={{
            background: "#d4a017",
            color: "#0f172a",
            fontSize: 28,
            fontWeight: 800,
            padding: "12px 24px",
            borderRadius: 12,
            alignSelf: "flex-start",
          }}
        >
          {eyebrow}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {price && (
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: "#fbbf24",
                lineHeight: 1.1,
              }}
            >
              {price}
            </div>
          )}
          <div
            style={{
              fontSize: price ? 40 : 56,
              fontWeight: 700,
              color: "white",
              lineHeight: 1.2,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 32, color: "#94a3b8" }}>{subtitle}</div>
          )}
        </div>
      </div>
    ),
    { ...ogSize }
  );
}
