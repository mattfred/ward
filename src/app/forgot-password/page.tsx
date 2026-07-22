"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setResetUrl(null);
    const res = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Request failed");
      return;
    }
    setMessage("If that email exists, a reset link was sent.");
    if (data.resetUrl) setResetUrl(data.resetUrl);
  }

  return (
    <main className="shell" style={{ padding: "3rem 0", maxWidth: 480 }}>
      <Link href="/" className="display" style={{ fontSize: "2rem" }}>
        Cohesive
      </Link>
      <h1 style={{ marginTop: "1.5rem" }}>Forgot password</h1>
      <form onSubmit={onSubmit} className="card-surface" style={{ padding: "1.25rem", display: "grid", gap: "0.85rem" }}>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {error ? <p style={{ color: "#9b2c2c", margin: 0 }}>{error}</p> : null}
        {message ? <p style={{ color: "var(--moss-deep)", margin: 0 }}>{message}</p> : null}
        {resetUrl ? (
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            Dev reset link: <a href={resetUrl}>{resetUrl}</a>
          </p>
        ) : null}
        <button className="btn btn-primary">Send reset link</button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/login">Back to login</Link>
      </p>
    </main>
  );
}
