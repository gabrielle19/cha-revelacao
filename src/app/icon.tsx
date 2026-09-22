import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F1E6D6",
        }}
      >
        <svg width="52" height="52" viewBox="0 0 120 120">
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
      </div>
    ),
    { ...size }
  );
}
