import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFunnelStats } from "@/lib/analytics";
import { isAdminEmail } from "@/lib/env";

export default async function MetricsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isAdminEmail(session.user.email)) redirect("/dashboard");

  const stats = await getFunnelStats();

  return (
    <main className="shell" style={{ padding: "2rem 0 4rem" }}>
      <Link href="/dashboard" className="display" style={{ fontSize: "1.8rem" }}>
        Cohesive
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Soft-launch metrics</h1>
      <p style={{ color: "var(--ink-soft)", maxWidth: "56ch" }}>
        Admin-only funnel for onboarding → blueprint → paid and cohesion feedback.
      </p>

      <section className="card-surface" style={{ padding: "1.25rem", marginTop: "1.25rem" }}>
        <h2 className="display" style={{ marginTop: 0 }}>Funnel</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.5rem 0", borderBottom: "1px solid var(--line)" }}>
                Event
              </th>
              <th style={{ textAlign: "right", padding: "0.5rem 0", borderBottom: "1px solid var(--line)" }}>
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {stats.funnel.map((row) => (
              <tr key={row.name}>
                <td style={{ padding: "0.55rem 0", borderBottom: "1px solid var(--line)" }}>{row.name}</td>
                <td
                  style={{
                    padding: "0.55rem 0",
                    borderBottom: "1px solid var(--line)",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {row.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card-surface" style={{ padding: "1.25rem", marginTop: "1rem" }}>
        <h2 className="display" style={{ marginTop: 0 }}>Cohesion feedback</h2>
        <p style={{ margin: 0 }}>
          Average score: <strong>{stats.cohesionAvg ? stats.cohesionAvg.toFixed(2) : "—"}</strong> / 5
          {" · "}
          {stats.feedbackCount} response{stats.feedbackCount === 1 ? "" : "s"}
        </p>
      </section>
    </main>
  );
}
