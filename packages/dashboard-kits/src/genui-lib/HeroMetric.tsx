"use client";

import { defineComponent, reactive, useStateField } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { HeroMetric as HeroMetricView } from "../components/HeroMetric";
import { kpiSchema, trendSchema } from "../core/schemas";
import { Pending } from "./Pending";

export const HeroMetric = defineComponent({
  name: "HeroMetric",
  description:
    'The one number a dashboard leads with: the metric at hero size, its change against the previous period, and a large trend of this period against the prior one, with the gap between them shaded and any events marked. Use exactly one per dashboard, in a LargeCard at the top. Pass a KPI tool\'s hero, heroTrend, and metrics, plus a $binding shared with KpiStrip, so selecting a KPI tile shows that metric here: $metric = "" then HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric) and KpiStrip(kpis.metrics, $metric).',
  props: z.object({
    metric: kpiSchema,
    trend: trendSchema.optional(),
    metrics: z.array(kpiSchema).optional(),
    selected: reactive(z.string().optional()),
  }),
  component: ({ props }) => {
    const field = useStateField("heroMetric", props.selected);
    const hero = props.metric;
    // A Query's default (a label and an empty trend) is still loading.
    if (!hero || (props.trend && props.trend.labels.length === 0)) return <Pending kind="hero" />;
    return (
      <HeroMetricView
        metric={hero}
        trend={props.trend}
        metrics={props.metrics}
        selected={typeof field.value === "string" ? field.value : undefined}
        onSelect={field.isReactive ? (label) => field.setValue(label) : undefined}
      />
    );
  },
});
