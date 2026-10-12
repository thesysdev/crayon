"use client";

import { Compass, Map as MapIcon, MessageCircle } from "lucide-react";
import "./chat.css";

// Explore, Chat and Itinerary: the planner's segmented control with Chat between the other two.
// The same track, segments and sliding white pill as PlannerTabs (itinerary.tsx); Itinerary stays
// the last segment, so a save still flies into it.

export type PlannerMode = "explore" | "chat" | "itinerary";

const tabs: { mode: PlannerMode; label: string; Icon: typeof Compass }[] = [
  { mode: "explore", label: "Explore", Icon: Compass },
  { mode: "chat", label: "Chat", Icon: MessageCircle },
  { mode: "itinerary", label: "Itinerary", Icon: MapIcon },
];

/** Frosted glass behind the track, set inline: the CSS build keeps only the -webkit- form of
 *  backdrop-filter, which Chrome ignores. */
const glass = { backdropFilter: "blur(18px) saturate(1.5)", WebkitBackdropFilter: "blur(18px) saturate(1.5)" };

export function PlannerChatTabs({ mode, onChange }: { mode: PlannerMode; onChange: (mode: PlannerMode) => void }) {
  return (
    <div className="pl-tabs pl-tabs--three" role="tablist" aria-label="Planner" data-mode={mode} style={glass}>
      <span className="pl-tabs__thumb" aria-hidden />
      {tabs.map(({ mode: m, label, Icon }) => (
        <button key={m} type="button" role="tab" className="pl-tab" aria-selected={mode === m} aria-label={label} title={label} onClick={() => onChange(m)}>
          <Icon aria-hidden strokeWidth={1.75} />
          {/* On phones the segments show their icons alone. */}
          <span className="pl-tab__label">{label}</span>
        </button>
      ))}
    </div>
  );
}
