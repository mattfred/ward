import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function TermsPage() {
  return (
    <main>
      <SiteHeader />
      <article className="shell" style={{ padding: "2rem 0 4rem", maxWidth: 720 }}>
        <h1 className="display" style={{ fontSize: "2.6rem" }}>Terms of Service</h1>
        <p style={{ color: "var(--ink-soft)" }}>Last updated: July 21, 2026</p>
        <p>
          Ward provides AI-assisted style and wardrobe planning tools. Style advice is informational — not a
          guarantee of fit, fashion outcomes, or purchase results. You are responsible for your buying decisions.
        </p>
        <p>
          Free and Premium features may change. Paid subscriptions renew until canceled through the billing portal.
          Abuse, scraping, or attempts to bypass rate limits or billing may result in account suspension.
        </p>
        <p>
          The service is provided “as is” without warranties to the extent permitted by law. See our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
