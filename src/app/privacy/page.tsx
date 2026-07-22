import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function PrivacyPage() {
  return (
    <main>
      <SiteHeader />
      <article className="shell" style={{ padding: "2rem 0 4rem", maxWidth: 720 }}>
        <h1 className="display" style={{ fontSize: "2.6rem" }}>Privacy Policy</h1>
        <p style={{ color: "var(--ink-soft)" }}>Last updated: July 21, 2026</p>
        <p>
          Cohesive (“we”) helps you build a cohesive wardrobe. We collect account information (name, email,
          password hash), style profile answers, generated wardrobe plans, usage analytics events, and optional
          feedback. If you subscribe, Stripe processes payment details — we store customer/subscription IDs, not
          full card numbers.
        </p>
        <p>
          We use this data to operate the product, personalize style guidance, prevent abuse, and improve Cohesive.
          We do not sell personal data. Wardrobe and style data is treated as personal.
        </p>
        <p>
          You may update or delete your account in Account settings. Contact the operator of your deployment for
          data requests.
        </p>
        <p>
          <Link href="/terms">Terms of Service</Link>
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
