"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { ScatterChart as ScatterChartComponent } from "../../components/Charts";
import { buildScatterChartData, hasAllProps } from "../helpers";
import { ScatterSeriesSchema } from "./ScatterSeries";

export const ScatterChartSchema = z.object({
  datasets: z.array(ScatterSeriesSchema),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export const ScatterChart = defineComponent({
  name: "ScatterChart",
  props: ScatterChartSchema,
  description: "X/Y scatter plot; use for correlations, distributions, and clustering",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "datasets")) return null;
    const data = buildScatterChartData((props as Record<string, unknown>).datasets);
    if (!data.length) return null;
    return React.createElement(ScatterChartComponent, {
      data,
      xAxisDataKey: "x",
      yAxisDataKey: "y",
      isAnimationActive: false,
    });
  },
});
