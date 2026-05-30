"use client";

import Box from "@mui/material/Box";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

import { asArray, buildPie, buildSeries, hasAllProps } from "../helpers";
import { CHART_PALETTE } from "../theme";

const CHART_HEIGHT = 260;
const CHART_MARGIN = { top: 16, right: 16, bottom: 30, left: 44 };

// ── Virtual sub-components (data-only) ──

const SeriesSchema = z.object({
  category: z.string(),
  values: z.array(z.number()),
});

export const Series = defineComponent({
  name: "Series",
  props: SeriesSchema,
  description: "One named data series with values matching labels.",
  component: () => null,
});

const SliceSchema = z.object({
  category: z.string(),
  value: z.number(),
});

export const Slice = defineComponent({
  name: "Slice",
  props: SliceSchema,
  description: "A single slice in a PieChart.",
  component: () => null,
});

// ── BarChart ──

export const BarChartComponent = defineComponent({
  name: "BarChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(SeriesSchema),
    variant: z.enum(["grouped", "stacked"]).optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Vertical bar chart. Use for comparing values across categories.",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "labels", "series")) return null;
    const labels = asArray(props.labels).map(String);
    const series = buildSeries(props.series);
    if (!series.length) return null;
    const stacked = props.variant === "stacked";

    return (
      <Box sx={{ width: "100%" }}>
        <BarChart
          height={CHART_HEIGHT}
          margin={CHART_MARGIN}
          xAxis={[{ data: labels, scaleType: "band", label: props.xLabel }]}
          yAxis={[{ label: props.yLabel }]}
          series={series.map((s, i) => ({
            data: s.data,
            label: s.label,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
            ...(stacked ? { stack: "total" } : {}),
          }))}
        />
      </Box>
    );
  },
});

// ── LineChart ──

export const LineChartComponent = defineComponent({
  name: "LineChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(SeriesSchema),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Line chart for trends over categories.",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "labels", "series")) return null;
    const labels = asArray(props.labels).map(String);
    const series = buildSeries(props.series);
    if (!series.length) return null;

    return (
      <Box sx={{ width: "100%" }}>
        <LineChart
          height={CHART_HEIGHT}
          margin={CHART_MARGIN}
          xAxis={[{ data: labels, scaleType: "point", label: props.xLabel }]}
          yAxis={[{ label: props.yLabel }]}
          series={series.map((s, i) => ({
            data: s.data,
            label: s.label,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
            curve: "monotoneX",
            showMark: false,
          }))}
        />
      </Box>
    );
  },
});

// ── PieChart ──

export const PieChartComponent = defineComponent({
  name: "PieChart",
  props: z.object({
    slices: z.array(SliceSchema),
    donut: z.boolean().optional(),
  }),
  description: "Pie or donut chart. slices: Slice[], donut: boolean for a ring chart.",
  component: ({ props }) => {
    const data = buildPie(props.slices);
    if (!data.length) return null;
    const colored = data.map((d, i) => ({ ...d, color: CHART_PALETTE[i % CHART_PALETTE.length] }));

    return (
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <PieChart
          height={CHART_HEIGHT}
          series={[
            {
              data: colored,
              innerRadius: props.donut ? 60 : 0,
              paddingAngle: props.donut ? 2 : 0,
              cornerRadius: 3,
            },
          ]}
        />
      </Box>
    );
  },
});
