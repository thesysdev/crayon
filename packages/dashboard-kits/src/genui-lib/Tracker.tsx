"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Tracker as TrackerView } from "../components/Charts/Tracker";
import { passed, type TrackerItem } from "../core/schemas";
import { Pending } from "./Pending";

export const Tracker = defineComponent({
  name: "Tracker",
  description:
    "A strip of blocks, one per day or check, each colored by whether it met its target, with the day's figure on hover and a count of each status. For service levels and streaks: orders shipped on time each day, uptime, daily goals hit. Pass a tracker tool's days and summary directly: Tracker(sla.days, sla.summary).",
  props: z.object({
    items: z.array(passed("A day from a tracker tool")).default([]),
    summary: z.string().optional().describe('One line above the strip, e.g. "96.8% on time"'),
  }),
  component: ({ props }) => {
    const items = (props.items ?? []) as unknown as TrackerItem[];
    if (items.length === 0) return <Pending kind="columns" />;
    return <TrackerView items={items} summary={props.summary} />;
  },
});
