import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cedar Yard | Offline",
};

export default function OfflinePage() {
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        alignContent: "center",
        boxSizing: "border-box",
        width: "100%",
        maxWidth: 484,
        margin: "0 auto",
        padding: 32,
        overflowY: "auto",
        background: "#f5f4ef",
        color: "#173f30",
        font: "16px system-ui, sans-serif",
      }}
    >
      <small style={{ letterSpacing: "0.15em" }}>THE CEDAR SHOP · YARD</small>
      <h1 style={{ margin: "0.67em 0", fontSize: 38, lineHeight: 1.1 }}>
        You're offline.
      </h1>

      <p style={{ margin: "1em 0", color: "#536358", lineHeight: 1.7 }}>
        Reconnect to open the yard workspace. Demo changes already saved on
        this device are still stored in this browser.
      </p>

      <p style={{ margin: "1em 0", color: "#536358", lineHeight: 1.7 }}>
        Offline editing and automatic sync are not available in this prototype.
      </p>

      <form action="/yard/" method="get" style={{ marginTop: 8 }}>
        <button
          type="submit"
          style={{
            border: 0,
            borderRadius: 6,
            padding: "15px 24px",
            background: "#116343",
            color: "white",
            cursor: "pointer",
            font: "inherit",
          }}
        >
          Try again
        </button>
      </form>
    </main>
  );
}
