"use client";

import { Chips } from "@openuidev/react-ui";
import {
  BedDouble,
  CalendarDays,
  Camera,
  Heart,
  Leaf,
  Map,
  Moon,
  Mountain,
  Plane,
  Snowflake,
  Sparkles,
  Sun,
  TreePalm,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Chip } from "./agent/follow-ups";

// The chips above the prompt bar: generated starters on an empty trip, and after every agent
// turn, the planner's suggested next steps or likely answers. Each trip keeps its last set.

const icons: Record<Chip["icon"], typeof Plane> = {
  plane: Plane,
  leaf: Leaf,
  heart: Heart,
  mountain: Mountain,
  palm: TreePalm,
  moon: Moon,
  sun: Sun,
  snow: Snowflake,
  food: UtensilsCrossed,
  bed: BedDouble,
  calendar: CalendarDays,
  wallet: Wallet,
  users: Users,
  camera: Camera,
  map: Map,
  sparkles: Sparkles,
};

const key = (trip: string) => `openui-moodboard-chips:${trip}`;

export const savedChips = {
  load(trip: string): Chip[] {
    try {
      return JSON.parse(localStorage.getItem(key(trip)) ?? "[]");
    } catch {
      return [];
    }
  },
  save(trip: string, chips: Chip[]) {
    try {
      if (chips.length) localStorage.setItem(key(trip), JSON.stringify(chips));
      else localStorage.removeItem(key(trip));
    } catch {}
  },
};

// Asks the agent route for chips after a turn: next steps, or answers to an open question.
export async function fetchFollowUps(messages: unknown[], asking: boolean, signal?: AbortSignal) {
  const response = await fetch("/api/moodboard/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, followUps: { asking } }),
    signal,
  }).catch(() => null);
  if (!response?.ok) return [];
  return ((await response.json().catch(() => ({}))) as { chips?: Chip[] }).chips ?? [];
}

// Starter ideas for an empty trip, fetched once per page and reused by every new trip.
let starters: Promise<Chip[]> | undefined;
export function useStarters(enabled: boolean, avoid: string[]) {
  const [chips, setChips] = useState<Chip[] | null>(null);
  const places = avoid.join(",");
  useEffect(() => {
    if (!enabled) return;
    starters ??= fetch(`/api/moodboard/agent?avoid=${encodeURIComponent(places)}`)
      .then((response) => (response.ok ? response.json() : { chips: [] }))
      .then((result: { chips?: Chip[] }) => result.chips ?? [])
      .catch(() => []);
    let live = true;
    void starters.then((result) => {
      if (!result.length) starters = undefined;
      if (live) setChips(result);
    });
    return () => {
      live = false;
    };
  }, [enabled, places]);
  return chips;
}

export function ChipRow({
  chips,
  selected,
  onPick,
}: {
  chips: Chip[];
  selected?: string;
  onPick: (prompt: string) => void;
}) {
  if (!chips.length) return null;
  return (
    <Chips
      type="single"
      className="mb-categories mb-follow-ups"
      items={chips.map((chip) => {
        const Icon = icons[chip.icon] ?? Sparkles;
        return { value: chip.prompt, label: chip.label, icon: <Icon size={14} /> };
      })}
      selected={selected && chips.some((chip) => chip.prompt === selected) ? [selected] : []}
      onToggle={onPick}
    />
  );
}
