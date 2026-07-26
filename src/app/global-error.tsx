"use client";

/**
 * Root error UI for unrecoverable render failures.
 * Launch ops: minimum crash surface until Sentry (or equivalent) is wired.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#031B4E",
          color: "#fff",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p style={{ fontSize: 14, letterSpacing: "0.08em", opacity: 0.8 }}>YIKE</p>
          <h1 style={{ fontSize: 22, margin: "12px 0" }}>Something went wrong</h1>
          <p style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.5 }}>
            Please try again. If this keeps happening, contact support.
          </p>
          {error.digest ? (
            <p style={{ fontSize: 11, opacity: 0.55, marginTop: 12 }}>Ref: {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 20,
              background: "#E4B547",
              color: "#031B4E",
              border: 0,
              borderRadius: 999,
              padding: "10px 18px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
