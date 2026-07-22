"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => params.get("token") || "", [params]);
  const email = useMemo(() => params.get("email") || "", [params]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset", token, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Reset failed");
      return;
    }
    router.push("/login");
  }

  return (
    <form onSubmit={onSubmit} className="card-surface" style={{ padding: "1.25rem", display: "grid", gap: "0.85rem" }}>
      <div className="field">
        <label>Email</label>
        <input value={email} readOnly />
      </div>
      <div className="field">
        <label>New password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
      </div>
      {error ? <p style={{ color: "#9b2c2c", margin: 0 }}>{error}</p> : null}
      <button className="btn btn-primary" disabled={!token}>
        Update password
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="shell" style={{ padding: "3rem 0", maxWidth: 480 }}>
      <Link href="/" className="display" style={{ fontSize: "2rem" }}>
        Cohesive
      </Link>
      <h1 style={{ marginTop: "1.5rem" }}>Reset password</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
