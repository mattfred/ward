"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="shell" style={{ padding: "4rem 0", textAlign: "center" }}>
      <p className="display" style={{ fontSize: "3rem", margin: 0 }}>
        Cohesive
      </p>
      <h1 style={{ marginTop: "1rem" }}>Something went wrong</h1>
      <p style={{ color: "var(--ink-soft)" }}>{error.message || "Unexpected error"}</p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn btn-ghost">
          Home
        </Link>
      </div>
    </main>
  );
}
