"use client";

import { defineComponent, reactive, useStateField } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { KpiStrip as KpiStripView } from "../components/KpiStrip";
import { passed, type Kpi } from "../core/schemas";
import { Pending } from "./Pending";

export const KpiStrip = defineComponent({
  name: "KpiStrip",
  description:
    "Row of supporting KPI tiles: each shows its value, the change against the comparison colored by whether that direction is good, the comparison value, a sparkline, and a benchmark, with its definition on hover. Pass a KPI tool's metrics directly; a hand-made tile is {label, value, change?, previous?, hint?}. Give it the same $binding as HeroMetric and each tile becomes a tab that shows its metric in the hero chart: KpiStrip(kpis.metrics, $metric). Handles metrics where lower is better.",
  props: z.object({
    metrics: z.array(passed("A KPI")).default([]),
    selected: reactive(z.string().optional()),
  }),
  component: ({ props }) => {
    const field = useStateField("kpiMetric", props.selected);
    const metrics = ((props.metrics ?? []) as unknown as Kpi[]).filter((m) => m?.label);
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
