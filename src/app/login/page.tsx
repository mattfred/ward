"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { FormEvent, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setLoading(false);
      setError("Invalid email or password");
      return;
    }
    window.location.assign(callbackUrl);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="card-surface"
      style={{ padding: "1.25rem", marginTop: "1rem", display: "grid", gap: "0.9rem" }}
    >
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
      </div>
      {error ? <p style={{ color: "#9b2c2c", margin: 0 }}>{error}</p> : null}
      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="shell" style={{ padding: "3rem 0", maxWidth: 480 }}>
      <Link href="/" className="display" style={{ fontSize: "2rem" }}>
        Ward
      </Link>
      <h1 style={{ marginTop: "1.5rem", fontSize: "1.5rem" }}>Welcome back</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <LoginForm />
      </Suspense>
      <p style={{ marginTop: "1rem" }}>
        New here? <Link href="/signup">Create an account</Link>
        {" · "}
        <Link href="/forgot-password">Forgot password</Link>
      </p>
    </main>
  );
}
