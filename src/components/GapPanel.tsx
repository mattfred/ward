import type { GapInsight } from "@/lib/gaps";

export function GapPanel({ insight }: { insight: GapInsight }) {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <p style={{ margin: 0, color: "var(--ink-soft)" }}>{insight.summary}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        <InsightColumn title="Keep" items={insight.keep.map((p) => p.name)} empty="Mark keepers in the blueprint." />
        <InsightColumn
          title="Replace"
          items={insight.replace.map((p) => p.name)}
          empty="Nothing flagged as wrong-fit yet."
        />
        <InsightColumn title="Gaps" items={insight.gaps.slice(0, 8).map((p) => p.name)} empty="No open gaps." />
      </div>
      <style>{`
        @media (max-width: 800px) {
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function InsightColumn({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div
      style={{
        padding: "0.9rem",
        borderRadius: 14,
        border: "1px solid var(--line)",
        background: "rgba(255,255,255,0.5)",
      }}
    >
      <h3 style={{ margin: "0 0 0.5rem" }}>{title}</h3>
      {items.length ? (
        <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.92rem" }}>{empty}</p>
      )}
    </div>
  );
}
