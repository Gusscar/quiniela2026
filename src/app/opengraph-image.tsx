import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Quiniela Mundial 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #14532d 50%, #0f172a 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(34,197,94,0.1)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(34,197,94,0.08)",
            display: "flex",
          }}
        />

        {/* Ball icon */}
        <div
          style={{
            fontSize: "100px",
            marginBottom: "24px",
            display: "flex",
          }}
        >
          ⚽
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "baseline",
            gap: "16px",
          }}
        >
          <span
            style={{
              fontSize: "80px",
              fontWeight: 800,
              color: "#22c55e",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            Quiniela
          </span>
          <span
            style={{
              fontSize: "80px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            Mundial 2026
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "120px",
            height: "4px",
            background: "#22c55e",
            borderRadius: "2px",
            margin: "28px 0",
            display: "flex",
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            color: "#94a3b8",
            letterSpacing: "0.5px",
            display: "flex",
          }}
        >
          Predice, compite y gana con tus amigos
        </div>

        {/* Bottom tag */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#22c55e",
              display: "flex",
            }}
          />
          <span style={{ fontSize: "20px", color: "#64748b" }}>
            quiniela2026-one.vercel.app
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
