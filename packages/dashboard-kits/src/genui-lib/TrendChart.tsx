"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { TrendChart as TrendChartView } from "../components/Charts/TrendChart";
import { FILL_MAX_HEIGHT } from "../components/Charts/utils/constants";
import { eventSchema, formatSchema, seriesSchema } from "../core/schemas";
import { Pending } from "./Pending";

export const TrendChart = defineComponent({
  name: "TrendChart",
  description:
    'Line or area chart over time with a crosshair tooltip, an end label, and shaded events. Up to 4 series, colored in a fixed order; mark context series "muted" (e.g. the prior period) and the series the story is about "primary". Use it instead of LineChart and AreaChart: TrendChart(sales.labels, [{name: "This period", values: sales.totalSales, emphasis: "primary"}, {name: "Prior period", values: sales.previousPeriod, emphasis: "muted"}], "currency").',
  props: z.object({
    labels: z.array(z.string()).default([]),
    series: z.array(seriesSchema).default([]),
    format: formatSchema.optional(),
    variant: z.enum(["area", "line"]).optional(),
    events: z.array(eventSchema).optional(),
  }),
  component: ({ props }) => {
    const labels = props.labels ?? [];
    const series = props.series ?? [];
    if (labels.length === 0 || !series.some((s) => s.values.length > 0)) {
      return <Pending kind="trend" />;
    }
    return (
      <TrendChartView
        labels={labels}
        series={series}
        format={props.format}
        variant={props.variant}
        events={props.events}
        fill
        maxHeight={FILL_MAX_HEIGHT}
      />
    );
  },
});
