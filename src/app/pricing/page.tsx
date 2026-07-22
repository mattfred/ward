import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { UpgradeButton } from "@/components/UpgradeButton";
import { PRICING } from "@/lib/stripe";
import { auth } from "@/lib/auth";

export default async function PricingPage() {
  const session = await auth();

  return (
    <main>
      <SiteHeader />
      <section className="shell" style={{ padding: "2rem 0 4rem" }}>
        <h1 className="display" style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)", marginBottom: "0.5rem" }}>
          Free to discover. Premium to rebuild fully.
        </h1>
        <p style={{ color: "var(--ink-soft)", maxWidth: "52ch", fontSize: "1.05rem" }}>
          Cohesion-first pricing. We don’t need affiliate shopping to make Free useful — Premium unlocks
          depth across every event in your life.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          <article className="card-surface" style={{ padding: "1.4rem" }}>
            <h2 className="display" style={{ marginTop: 0 }}>Free</h2>
            <p style={{ fontSize: "1.6rem", fontWeight: 600, margin: "0.25rem 0 1rem" }}>$0</p>
            <ul>
              <li>Style identity onboarding</li>
              <li>Life map</li>
              <li>Style system summary</li>
              <li>1 primary lifestyle blueprint</li>
              <li>Top 5 rebuild priorities</li>
            </ul>
            <Link href={session ? "/dashboard" : "/signup"} className="btn btn-ghost">
              {session ? "Go to dashboard" : "Start free"}
            </Link>
          </article>

          <article
            className="card-surface"
            style={{ padding: "1.4rem", borderColor: "rgba(47,93,74,0.35)", background: "rgba(47,93,74,0.08)" }}
          >
            <h2 className="display" style={{ marginTop: 0 }}>Premium</h2>
            <p style={{ fontSize: "1.6rem", fontWeight: 600, margin: "0.25rem 0 0.25rem" }}>
              {PRICING.monthly.label}
            </p>
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>or {PRICING.yearly.label}</p>
            <ul>
              <li>Full multi-event wardrobe architecture</li>
              <li>Complete rebuild roadmap + budget pacing</li>
              <li>Purchase-fit guardrails</li>
              <li>Ownership tracking on blueprint pieces</li>
              <li>Seasonal refresh path (coming next)</li>
            </ul>
            {session ? (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <UpgradeButton label={`Go Premium · ${PRICING.monthly.label}`} interval="monthly" />
                <UpgradeButton label={`Yearly · ${PRICING.yearly.label}`} interval="yearly" />
              </div>
            ) : (
              <Link href="/signup" className="btn btn-accent">
                Create account to upgrade
              </Link>
            )}
          </article>
        </div>
      </section>
      <SiteFooter />
      <style>{`
        @media (max-width: 800px) {
          section.shell > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
