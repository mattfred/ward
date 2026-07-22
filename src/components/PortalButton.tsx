"use client";

export function PortalButton() {
  async function open() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.url) window.location.href = data.url;
    else alert(data.error || "Billing portal unavailable");
  }
  return (
    <button className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }} onClick={open} type="button">
      Billing
    </button>
  );
}
