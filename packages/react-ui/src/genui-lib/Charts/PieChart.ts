"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { PieChart as PieChartComponent } from "../../components/Charts";
import { buildLabeledValueData, buildSliceData } from "../helpers";

export const PieChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
  variant: z.enum(["pie", "donut"]).optional(),
});

export const PieChart = defineComponent({
  name: "PieChart",
  props: PieChartSchema,
  description: "Circular slices; use plucked arrays: PieChart(data.categories, data.values)",
  component: ({ props }) => {
    const data = buildLabeledValueData(props.labels, props.values);
    if (data.length > 0) {
      return React.createElement(PieChartComponent, {
        data,
        categoryKey: "category",
        dataKey: "value",
        variant: props.variant as "pie" | "donut" | undefined,
        isAnimationActive: false,
      });
    }

    const sliceData = buildSliceData(props.labels);
    if (sliceData.length) {
      return React.createElement(PieChartComponent, {
        data: sliceData,
        categoryKey: "category",
        dataKey: "value",
        variant: props.variant as "pie" | "donut" | undefined,
        isAnimationActive: false,
      });
    }

    return null;
  },
});
