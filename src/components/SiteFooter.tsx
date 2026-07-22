import Link from "next/link";

export function SiteFooter() {
  return (
    <footer
      className="shell"
      style={{
        padding: "2.5rem 0 3rem",
        borderTop: "1px solid var(--line)",
        marginTop: "2rem",
        display: "flex",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
        color: "var(--ink-soft)",
        fontSize: "0.92rem",
      }}
    >
      <span className="display" style={{ color: "var(--ink)", fontSize: "1.2rem" }}>
        Ward
      </span>
      <nav style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link href="/pricing">Pricing</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </footer>
  );
}
