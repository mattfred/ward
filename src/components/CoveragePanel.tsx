import Link from "next/link";
import type { BlueprintCoverage } from "@/lib/coverage";
import { coverageSummary } from "@/lib/coverage";
import { shoppingLinks, gapShoppingLinks } from "@/lib/shopping";
import type { BlueprintPiece } from "@/lib/types";

export function CoveragePanel({
  coverage,
  pieces,
}: {
  coverage: BlueprintCoverage[];
  pieces: BlueprintPiece[];
}) {
  const summary = coverageSummary(coverage);
  const pieceById = new Map(pieces.map((p) => [p.id, p]));
  const gaps = coverage.filter((c) => c.status === "gap").slice(0, 8);

  return (
    <section className="card-surface" style={{ padding: "1.25rem", marginTop: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 className="display" style={{ marginTop: 0, fontSize: "1.8rem" }}>
            Blueprint ↔ closet
          </h2>
          <p style={{ color: "var(--ink-soft)", marginBottom: 0 }}>
            {summary.filled}/{summary.total} slots filled ({summary.percent}%).{" "}
            <Link href="/closet">Manage closet</Link>
          </p>
        </div>
      </div>
      {gaps.length ? (
        <div style={{ marginTop: "1rem", display: "grid", gap: "0.65rem" }}>
          <strong style={{ fontSize: "0.95rem" }}>Shop gaps · images & live prices</strong>
          {gaps.map((gap) => {
            const piece = pieceById.get(gap.pieceId);
            const links = piece ? gapShoppingLinks(piece) : shoppingLinks({
              id: gap.pieceId,
              eventId: "",
              eventName: gap.eventName,
              category: gap.category,
              name: gap.pieceName,
              rationale: "",
              quantity: 1,
              priority: 1,
              ownership: "not_owned",
            });
            return (
              <div
                key={gap.pieceId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                  padding: "0.65rem 0.75rem",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                }}
              >
                <div>
                  <div>
                    {gap.category}: {gap.pieceName}
                  </div>
                  <div style={{ color: "var(--ink-soft)", fontSize: "0.88rem" }}>{gap.eventName}</div>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <a
                    className="btn btn-ghost"
                    href={links.images}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                  >
                    Images
                  </a>
                  <a
                    className="btn btn-ghost"
                    href={links.shop}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                  >
                    Prices
                  </a>
                  <Link
                    href="/closet"
                    className="btn btn-ghost"
                    style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                  >
                    Link owned
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color: "var(--ink-soft)", marginTop: "0.75rem", marginBottom: 0 }}>
          Every visible blueprint slot has an owned item linked. Nice.
        </p>
      )}
    </section>
  );
}
