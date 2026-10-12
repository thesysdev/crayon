"use client";

import { defineComponent, reactive, useStateField } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { KpiStrip as KpiStripView } from "../components/KpiStrip";
import { kpiSchema } from "../core/schemas";
import { Pending } from "./Pending";

export const KpiStrip = defineComponent({
  name: "KpiStrip",
  description:
    "Row of supporting KPI tiles: each shows its value, the change against the previous period colored by whether that direction is good, the previous value, a sparkline, and a definition or benchmark. Pass a KPI tool's metrics directly. Give it the same $binding as HeroMetric and each tile becomes a tab that shows its metric in the hero chart: KpiStrip(kpis.metrics, $metric). Handles metrics where lower is better.",
  props: z.object({
    metrics: z.array(kpiSchema).default([]),
    selected: reactive(z.string().optional()),
  }),
  component: ({ props }) => {
    const field = useStateField("kpiMetric", props.selected);
    const metrics = props.metrics ?? [];
    if (metrics.length === 0) return <Pending kind="tiles" />;
    return (
      <KpiStripView
        metrics={metrics}
        selected={typeof field.value === "string" ? field.value : undefined}
        onSelect={field.isReactive ? (label) => field.setValue(label) : undefined}
      />
    );
  },
});
