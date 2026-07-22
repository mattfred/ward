"use client";

import { useMemo, useState } from "react";
import type { BlueprintPiece, OwnershipStatus, PreferenceMemory, RoadmapItem } from "@/lib/types";
import { FREE_ROADMAP_LIMIT } from "@/lib/types";
import { analyzeOwnership, computeWeeklyFocus } from "@/lib/gaps";
import { GapPanel } from "@/components/GapPanel";
import { OwnershipControls } from "@/components/OwnershipControls";
import { RoadmapList } from "@/components/RoadmapList";
import { UpgradeButton } from "@/components/UpgradeButton";
import { MemoryPanel } from "@/components/MemoryPanel";

export function ArchitectureSections({
  pieces: initialPieces,
  roadmap,
  eventsBlurb,
  lockedEvents,
  lockedRoadmap,
  premium,
  initialWeeklyFocus,
  preferenceMemory,
}: {
  pieces: BlueprintPiece[];
  roadmap: RoadmapItem[];
  eventsBlurb: string;
  lockedEvents: boolean;
  lockedRoadmap: boolean;
  premium: boolean;
  initialWeeklyFocus?: string | null;
  preferenceMemory: PreferenceMemory;
}) {
  const [pieces, setPieces] = useState(initialPieces);
  const [memory, setMemory] = useState(preferenceMemory);
  const insight = useMemo(() => analyzeOwnership(pieces), [pieces]);
  const weeklyFocus = useMemo(
    () => computeWeeklyFocus(pieces, initialWeeklyFocus),
    [pieces, initialWeeklyFocus],
  );

  function onOwnershipChange(pieceId: string, ownership: OwnershipStatus) {
    setPieces((prev) =>
      prev.map((p) => (p.id === pieceId ? { ...p, ownership } : p)),
    );
  }

  return (
    <>
      <section className="card-surface" style={{ padding: "1.4rem", marginTop: "1rem" }}>
        <h2 className="display" style={{ marginTop: 0, fontSize: "2rem" }}>
          Keep · replace · gaps
        </h2>
        <GapPanel insight={insight} />
      </section>

      <MemoryPanel memory={memory} />

      <section className="card-surface" style={{ padding: "1.4rem", marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <h2 className="display" style={{ margin: 0, fontSize: "2rem" }}>
            Wardrobe blueprint
          </h2>
          {lockedEvents ? <UpgradeButton label="Unlock all events" /> : null}
        </div>
        <p style={{ color: "var(--ink-soft)" }}>{eventsBlurb}</p>
        <OwnershipControls
          pieces={pieces}
          onOwnershipChange={onOwnershipChange}
          onPiecesChange={setPieces}
          onMemoryChange={setMemory}
        />
      </section>

      <section className="card-surface" style={{ padding: "1.4rem", marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h2 className="display" style={{ margin: 0, fontSize: "2rem" }}>
              Rebuild roadmap
            </h2>
            <p style={{ color: "var(--ink-soft)", marginBottom: 0 }}>{weeklyFocus}</p>
          </div>
          {lockedRoadmap ? <UpgradeButton label="Unlock full roadmap" /> : null}
        </div>
        <RoadmapList items={roadmap} />
        {!premium ? (
          <p style={{ color: "var(--ink-soft)", marginTop: "0.75rem" }}>
            Free includes your top {FREE_ROADMAP_LIMIT} priority pieces.
          </p>
        ) : null}
      </section>
    </>
  );
}
