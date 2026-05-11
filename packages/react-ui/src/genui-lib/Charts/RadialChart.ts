"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { RadialChart as RadialChartComponent } from "../../components/Charts";
import { buildLabeledValueData, buildSliceData } from "../helpers";

export const RadialChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});

export const RadialChart = defineComponent({
  name: "RadialChart",
  props: RadialChartSchema,
  description: "Radial bars; use plucked arrays: RadialChart(data.categories, data.values)",
  component: ({ props }) => {
    const data = buildLabeledValueData(props.labels, props.values);
    if (data.length > 0) {
      return React.createElement(RadialChartComponent, {
        data,
        categoryKey: "category",
        dataKey: "value",
        isAnimationActive: false,
      });
    }

    const sliceData = buildSliceData(props.labels);
    if (sliceData.length) {
      return React.createElement(RadialChartComponent, {
        data: sliceData,
        categoryKey: "category",
        dataKey: "value",
        isAnimationActive: false,
      });
    }

    return null;
  },
});
