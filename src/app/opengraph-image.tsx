import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Chá Revelação — Bernardo ou Maria Júlia?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          background:
            "linear-gradient(165deg, #FBF7F1 0%, #F1E6D6 45%, #E3CFB4 100%)",
          fontFamily: "sans-serif",
          padding: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#E8DCC8",
            color: "#8B6F52",
            padding: "10px 28px",
            borderRadius: 999,
            fontSize: 30,
            letterSpacing: 8,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Chá Revelação
        </div>

        {/* Ursinho */}
        <svg width="200" height="200" viewBox="0 0 120 120" style={{ margin: "36px 0" }}>
          <circle cx="30" cy="34" r="18" fill="#C9A574" />
          <circle cx="90" cy="34" r="18" fill="#C9A574" />
          <circle cx="30" cy="34" r="9" fill="#8B6F52" />
          <circle cx="90" cy="34" r="9" fill="#8B6F52" />
          <circle cx="60" cy="66" r="40" fill="#C9A574" />
          <ellipse cx="60" cy="78" rx="24" ry="19" fill="#FAF6F0" />
          <circle cx="47" cy="60" r="5" fill="#5C4433" />
          <circle cx="73" cy="60" r="5" fill="#5C4433" />
          <ellipse cx="60" cy="72" rx="6" ry="4.5" fill="#5C4433" />
        </svg>

        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            color: "#5C4433",
            textAlign: "center",
          }}
        >
          Bernardo
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontStyle: "italic",
            color: "#B08968",
            margin: "6px 0",
          }}
        >
          ou
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            color: "#5C4433",
          }}
        >
          Maria Júlia?
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 32,
            color: "#8B6F52",
          }}
        >
          21 de novembro de 2026 · 13h
        </div>
      </div>
    ),
    { ...size }
  );
}
