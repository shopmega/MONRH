import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          padding: "56px",
          fontFamily: "Segoe UI, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: "2px solid #1d4ed8",
              color: "#1d4ed8",
              borderRadius: "999px",
              padding: "8px 18px",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Salarie.ma
          </div>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.05 }}>
            Droit du Travail
            <br />
            Maroc
          </div>
          <div style={{ fontSize: 32, color: "#334155", maxWidth: "88%" }}>
            Simulateurs legaux 2026, generateurs de lettres et articles pratiques.
          </div>
        </div>
        <div style={{ display: "flex", gap: "14px", fontSize: 26, color: "#0f172a" }}>
          <div style={{ padding: "8px 14px", background: "#e2e8f0", borderRadius: 12 }}>
            Simulateurs
          </div>
          <div style={{ padding: "8px 14px", background: "#e2e8f0", borderRadius: 12 }}>
            Documents
          </div>
          <div style={{ padding: "8px 14px", background: "#e2e8f0", borderRadius: 12 }}>Articles</div>
        </div>
      </div>
    ),
    size,
  );
}
