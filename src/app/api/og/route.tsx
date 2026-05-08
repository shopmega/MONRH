import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

export const runtime = "edge";

function clean(input: string | null, fallback: string, max: number) {
  if (!input) return fallback;
  const trimmed = input.replace(/\s+/g, " ").trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, max);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteName = clean(searchParams.get("site"), SITE_NAME, 70);
  const title = clean(searchParams.get("title"), SITE_NAME, 90);
  const subtitle = clean(
    searchParams.get("subtitle"),
    "Salaire, CNSS, litiges et modeles RH au Maroc",
    140,
  );

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #f4efe5 0%, #fff8ec 45%, #fbe7c3 100%)",
          color: "#172554",
          padding: "54px",
          fontFamily: "Segoe UI, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "2px solid #1d4ed8",
              color: "#1d4ed8",
              borderRadius: "999px",
              padding: "8px 18px",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {siteName}
          </div>
          <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
          <div style={{ fontSize: 30, color: "#334155", maxWidth: "90%" }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 22, color: "#0f172a" }}>{siteName}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
