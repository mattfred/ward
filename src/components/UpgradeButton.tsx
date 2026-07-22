"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";

export function UpgradeButton({
  label = "Upgrade to Premium",
  interval = "monthly",
}: {
  label?: string;
  interval?: "monthly" | "yearly";
}) {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.mode === "dev_bypass") {
        await update({ plan: "premium" });
        router.push("/dashboard?upgraded=1");
        router.refresh();
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn btn-accent" onClick={onClick} disabled={loading}>
        {loading ? "Opening…" : label}
      </button>
      {error ? (
        <p style={{ color: "#9b2c2c", marginTop: "0.5rem", fontSize: "0.9rem" }}>{error}</p>
      ) : null}
    </div>
  );
}
