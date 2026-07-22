import { FREE_EVENT_LIMIT, FREE_ROADMAP_LIMIT, type BlueprintPiece, type LifeEvent, type RoadmapItem } from "./types";

export function isPremium(plan: string | null | undefined) {
  return plan === "premium";
}

export function limitEvents(events: LifeEvent[], plan: string) {
  if (isPremium(plan)) return events;
  const sorted = [...events].sort((a, b) => a.priority - b.priority);
  return sorted.slice(0, FREE_EVENT_LIMIT);
}

export function limitBlueprint(pieces: BlueprintPiece[], plan: string, primaryEventId?: string | null) {
  if (isPremium(plan)) return pieces;
  const primary = primaryEventId ?? pieces[0]?.eventId;
  return pieces.filter((p) => p.eventId === primary);
}

export function limitRoadmap(items: RoadmapItem[], plan: string) {
  if (isPremium(plan)) return items;
  return items.filter((i) => i.order <= FREE_ROADMAP_LIMIT).slice(0, FREE_ROADMAP_LIMIT);
}

export function premiumLockedMessage(feature: string) {
  return `${feature} is part of Cohesive Premium — unlock your full multi-event wardrobe architecture.`;
}
