"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export function AccountForm({
  name,
  email,
  plan,
}: {
  name: string;
  email: string;
  plan: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const body: Record<string, string> = { name: displayName };
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }
    setMessage("Account updated");
    setCurrentPassword("");
    setNewPassword("");
    router.refresh();
  }

  async function openPortal() {
    setError(null);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not open billing portal");
      return;
    }
    window.location.href = data.url;
  }

  async function onDelete() {
    if (!confirm("Delete your Ward account and all wardrobe data? This cannot be undone.")) {
      return;
    }
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      setError("Delete failed");
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <p style={{ margin: 0, color: "var(--ink-soft)" }}>
        Signed in as <strong>{email}</strong> · plan <strong>{plan}</strong>
      </p>
      <form onSubmit={onSave} className="card-surface" style={{ padding: "1.2rem", display: "grid", gap: "0.85rem" }}>
        <div className="field">
          <label>Name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Current password (only if changing)</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label>New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
        </div>
        {error ? <p style={{ color: "#9b2c2c", margin: 0 }}>{error}</p> : null}
        {message ? <p style={{ color: "var(--moss-deep)", margin: 0 }}>{message}</p> : null}
        <button className="btn btn-primary" type="submit">
          Save account
        </button>
      </form>

      <div className="card-surface" style={{ padding: "1.2rem", display: "grid", gap: "0.75rem" }}>
        <h2 className="display" style={{ margin: 0, fontSize: "1.6rem" }}>
          Billing
        </h2>
        <p style={{ margin: 0, color: "var(--ink-soft)" }}>
          Manage subscription, payment method, or cancel via Stripe Customer Portal.
        </p>
        <button className="btn btn-ghost" onClick={openPortal} type="button">
          Open billing portal
        </button>
      </div>

      <div className="card-surface" style={{ padding: "1.2rem" }}>
        <h2 className="display" style={{ marginTop: 0, fontSize: "1.6rem" }}>
          Danger zone
        </h2>
        <button className="btn btn-accent" onClick={onDelete} type="button">
          Delete account
        </button>
      </div>
    </div>
  );
}
