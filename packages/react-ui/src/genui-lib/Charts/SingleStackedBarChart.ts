"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { SingleStackedBar as SingleStackedBarChartComponent } from "../../components/Charts";
import { buildLabeledValueData, buildSliceData } from "../helpers";

export const SingleStackedBarChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});

export const SingleStackedBarChart = defineComponent({
  name: "SingleStackedBarChart",
  props: SingleStackedBarChartSchema,
  description:
    "Single horizontal stacked bar; use plucked arrays: SingleStackedBarChart(data.categories, data.values)",
  component: ({ props }) => {
    const data = buildLabeledValueData(props.labels, props.values);
    if (data.length > 0) {
      return React.createElement(SingleStackedBarChartComponent, {
        data,
        categoryKey: "category",
        dataKey: "value",
      });
    }

    const sliceData = buildSliceData(props.labels);
    if (sliceData.length) {
      return React.createElement(SingleStackedBarChartComponent, {
        data: sliceData,
        categoryKey: "category",
        dataKey: "value",
      });
    }

    return null;
  },
});
