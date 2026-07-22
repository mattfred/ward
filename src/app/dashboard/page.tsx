import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/session";
import { limitBlueprint, limitRoadmap, isPremium } from "@/lib/freemium";
import { FREE_ROADMAP_LIMIT } from "@/lib/types";
import type { BlueprintPiece, LifeEvent, RoadmapItem, StyleSystemData } from "@/lib/types";
import { memoryFromRow } from "@/lib/profile";
import { PurchaseCheck } from "@/components/PurchaseCheck";
import { FeedbackForm } from "@/components/FeedbackForm";
import { RegenerateControls } from "@/components/RegenerateControls";
import { StyleSystemEditor } from "@/components/StyleSystemEditor";
import { ArchitectureSections } from "@/components/ArchitectureSections";
import { PortalButton } from "@/components/PortalButton";
import { isAdminEmail } from "@/lib/env";
import { track } from "@/lib/analytics";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      styleSystem: true,
      lifeMap: true,
      blueprint: true,
      roadmap: true,
      styleProfile: true,
    },
  });

  if (!user) redirect("/login");
  if (!user.styleSystem || !user.blueprint || !user.roadmap) redirect("/onboarding");

  await track("blueprint_viewed", { userId: user.id });
  await track("roadmap_viewed", { userId: user.id });

  const premium = isPremium(user.plan);
  const events = parseJson<LifeEvent[]>(user.lifeMap?.events, []);
  const system: StyleSystemData = {
    manifesto: user.styleSystem.manifesto,
    palette: parseJson(user.styleSystem.palette, []),
    silhouettes: parseJson(user.styleSystem.silhouettes, []),
    fabrics: parseJson(user.styleSystem.fabrics, []),
    alwaysRules: parseJson(user.styleSystem.alwaysRules, []),
    neverRules: parseJson(user.styleSystem.neverRules, []),
    signaturePieces: parseJson(user.styleSystem.signaturePieces, []),
    vibeReferences: parseJson(user.styleSystem.vibeReferences, []),
  };
  const allPieces = parseJson<BlueprintPiece[]>(user.blueprint.pieces, []);
  const pieces = limitBlueprint(allPieces, user.plan, user.lifeMap?.primaryEventId);
  const allRoadmap = parseJson<RoadmapItem[]>(user.roadmap.items, []);
  const roadmap = limitRoadmap(allRoadmap, user.plan);
  const lockedEvents = !premium && events.length > 1;
  const lockedRoadmap = !premium && allRoadmap.length > FREE_ROADMAP_LIMIT;
  const showMetrics = isAdminEmail(user.email);
  const eventsBlurb = premium
    ? `Full architecture across ${events.length} life contexts.`
    : `Showing your primary lifestyle only. ${Math.max(events.length - 1, 0)} more event(s) locked.`;
  const preferenceMemory = memoryFromRow(user.styleProfile || {});

  return (
    <main className="shell" style={{ padding: "1.5rem 0 4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <Link href="/" className="display" style={{ fontSize: "1.8rem" }}>
            Ward
          </Link>
          <p style={{ margin: "0.25rem 0 0", color: "var(--ink-soft)" }}>
            {user.name ? `Hi ${user.name}` : "Your wardrobe architecture"} ·{" "}
            <strong>{premium ? "Premium" : "Free"}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/account" className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }}>
            Account
          </Link>
          {premium ? <PortalButton /> : null}
          {showMetrics ? (
            <Link href="/metrics" className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }}>
              Metrics
            </Link>
          ) : null}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="btn btn-ghost" style={{ padding: "0.55rem 1rem" }}>
              Sign out
            </button>
          </form>
        </div>
      </div>

      {params.upgraded ? (
        <div className="card-surface" style={{ padding: "1rem", marginTop: "1rem", borderColor: "var(--moss)" }}>
          Premium is active. Your full multi-event blueprint and roadmap are unlocked.
        </div>
      ) : null}

      <section className="card-surface" style={{ padding: "1.4rem", marginTop: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <h2 className="display" style={{ marginTop: 0, fontSize: "2rem", marginBottom: 0 }}>
            Your style system
          </h2>
          <RegenerateControls />
        </div>
        <p style={{ fontSize: "1.05rem", lineHeight: 1.55, maxWidth: "62ch" }}>{system.manifesto}</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
          {system.palette.map((swatch) => (
            <span
              key={swatch.name}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                background: "rgba(255,255,255,0.55)",
                borderRadius: 999,
                padding: "0.35rem 0.7rem",
                border: "1px solid var(--line)",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: swatch.hex,
                  display: "inline-block",
                }}
              />
              {swatch.name}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginTop: "1.25rem",
          }}
        >
          <div>
            <h3 style={{ marginBottom: "0.4rem" }}>Always</h3>
            <ul>
              {system.alwaysRules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ marginBottom: "0.4rem" }}>Never</h3>
            <ul>
              {system.neverRules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
        <details style={{ marginTop: "1rem" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Edit style system</summary>
          <StyleSystemEditor system={system} />
        </details>
      </section>

      <ArchitectureSections
        key={pieces.map((p) => p.id).join("|")}
        pieces={pieces}
        roadmap={roadmap}
        eventsBlurb={eventsBlurb}
        lockedEvents={lockedEvents}
        lockedRoadmap={lockedRoadmap}
        premium={premium}
        initialWeeklyFocus={user.roadmap.weeklyFocus}
        preferenceMemory={preferenceMemory}
      />

      <section className="card-surface" style={{ padding: "1.4rem", marginTop: "1rem" }}>
        <h2 className="display" style={{ marginTop: 0, fontSize: "2rem" }}>
          Does this purchase fit?
        </h2>
        <PurchaseCheck premium={premium} />
      </section>

      <section className="card-surface" style={{ padding: "1.4rem", marginTop: "1rem" }}>
        <h2 className="display" style={{ marginTop: 0, fontSize: "2rem" }}>
          Soft-launch feedback
        </h2>
        <p style={{ color: "var(--ink-soft)" }}>
          After living with your system: does your closet feel more cohesive?
        </p>
        <FeedbackForm />
      </section>

      <style>{`
        @media (max-width: 800px) {
          section.card-surface div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
