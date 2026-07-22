"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    };

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        callbackUrl: "/onboarding",
        redirect: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setLoading(false);
    }
  }

  return (
    <main className="shell" style={{ padding: "3rem 0", maxWidth: 480 }}>
      <Link href="/" className="display" style={{ fontSize: "2rem" }}>
        Cohesive
      </Link>
      <h1 style={{ marginTop: "1.5rem", fontSize: "1.5rem" }}>Create your account</h1>
      <p style={{ color: "var(--ink-soft)" }}>Free to start — Premium unlocks your full rebuild.</p>

      <form onSubmit={onSubmit} className="card-surface" style={{ padding: "1.25rem", marginTop: "1rem", display: "grid", gap: "0.9rem" }}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={8} required />
        </div>
        {error ? <p style={{ color: "#9b2c2c", margin: 0 }}>{error}</p> : null}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Creating…" : "Start free"}
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
