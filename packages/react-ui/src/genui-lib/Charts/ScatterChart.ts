"use client";

import { defineComponent } from "@openuidev/lang-react";
import React from "react";
import { z } from "zod";
import { ScatterChart as ScatterChartComponent } from "../../components/Charts";
import { hasAllProps } from "../helpers";
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
    const datasets = (props as any).datasets as any[];
    const data = datasets.map((ds: any) => ({
      name: ds.name as string,
      data: ((ds.points ?? []) as any[]).map((pt: any) => ({
        x: pt.x as number,
        y: pt.y as number,
        ...(pt.z != null ? { z: pt.z as number } : {}),
      })),
    }));
    if (!data.length) return null;
    return React.createElement(ScatterChartComponent, {
      data,
      xAxisDataKey: "x",
      yAxisDataKey: "y",
      isAnimationActive: false,
    });
  },
});
