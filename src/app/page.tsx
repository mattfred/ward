import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <section className="shell" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
        <div
          className="fade-up"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "2rem",
            alignItems: "end",
            minHeight: "72vh",
          }}
        >
          <div>
            <p
              className="display"
              style={{
                fontSize: "clamp(3.2rem, 8vw, 6.4rem)",
                margin: 0,
                maxWidth: "11ch",
              }}
            >
              Ward
            </p>
            <h1
              className="fade-up-delay"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: "clamp(1.15rem, 2.4vw, 1.45rem)",
                lineHeight: 1.45,
                color: "var(--ink-soft)",
                maxWidth: "34ch",
                margin: "1.25rem 0 1.75rem",
              }}
            >
              An AI wardrobe architect that learns who you are, then guides a full rebuild for every
              part of your life.
            </h1>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link href="/signup" className="btn btn-primary">
                Build your style system
              </Link>
              <Link href="/pricing" className="btn btn-ghost">
                See Premium
              </Link>
            </div>
          </div>

          <div
            className="drift card-surface"
            style={{
              padding: "1.5rem",
              minHeight: "420px",
              backgroundImage:
                "linear-gradient(160deg, rgba(47,93,74,0.88), rgba(20,32,28,0.72)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22800%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22%3E%3Cstop stop-color=%22%23c4a35a%22 stop-opacity=%220.35%22/%3E%3Cstop offset=%221%22 stop-color=%22%23c46b4a%22 stop-opacity=%220.2%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22800%22 fill=%22url(%23g)%22/%3E%3Ccircle cx=%22220%22 cy=%22200%22 r=%22140%22 fill=%22%23ffffff%22 fill-opacity=%220.05%22/%3E%3Ccircle cx=%22580%22 cy=%22540%22 r=%22200%22 fill=%22%23ffffff%22 fill-opacity=%220.04%22/%3E%3C/svg%3E')",
              backgroundSize: "cover",
              color: "#f4faf6",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <p style={{ opacity: 0.85, marginBottom: "0.4rem", fontSize: "0.9rem" }}>
              Not a photo catalog
            </p>
            <p className="display" style={{ fontSize: "2rem", margin: 0 }}>
              Identity first.
              <br />
              Wardrobe second.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: "3.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
          }}
        >
          {[
            {
              title: "Style system",
              body: "Palette, silhouettes, always/never rules — a manifesto you can actually dress from.",
            },
            {
              title: "Event blueprint",
              body: "Architect pieces for work, weekends, travel, and nights out — not random shopping lists.",
            },
            {
              title: "Rebuild roadmap",
              body: "Prioritized buys that unlock outfits, plus purchase-fit checks so you stay cohesive.",
            },
          ].map((item) => (
            <article key={item.title} className="card-surface" style={{ padding: "1.25rem" }}>
              <h2 className="display" style={{ fontSize: "1.55rem", marginTop: 0 }}>
                {item.title}
              </h2>
              <p style={{ color: "var(--ink-soft)", marginBottom: 0 }}>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />

      <style>{`
        @media (max-width: 860px) {
          section.shell > div:first-child {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
          }
          section.shell > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
