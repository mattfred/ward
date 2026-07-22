import Link from "next/link";
import { auth } from "@/lib/auth";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="shell" style={{ paddingTop: "1.25rem", paddingBottom: "1rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <Link href="/" className="display" style={{ fontSize: "1.55rem" }}>
          Ward
        </Link>
        <nav style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/pricing" className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }}>
            Pricing
          </Link>
          <Link href="/privacy" className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }}>
            Privacy
          </Link>
          {session?.user ? (
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: "0.55rem 1rem" }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }}>
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary" style={{ padding: "0.55rem 1rem" }}>
                Start free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
