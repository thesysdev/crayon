"use client";

import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { defineComponent } from "@openuidev/react-lang";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";

const CHART_COLORS = ["#1976d2", "#dc004e", "#388e3c", "#f57c00", "#7b1fa2", "#0097a7", "#c2185b"];

interface SeriesData {
  name: string;
  data: number[];
}

interface SliceData {
  name: string;
  value: number;
}

function useMUITheme() {
  const theme = useTheme();
  return {
    textColor: theme.palette.text.secondary,
    gridColor: theme.palette.divider,
    fontFamily: theme.typography.fontFamily,
  };
}

function buildSeriesData(
  labels: string[],
  seriesList: SeriesData[],
): Record<string, string | number>[] {
  return labels.map((label, i) => {
    const point: Record<string, string | number> = { name: label };
    for (const s of seriesList) {
      point[s.name] = s.data[i] ?? 0;
    }
    return point;
  });
}

export const BarChartComponent = defineComponent({
  name: "BarChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(z.object({ name: z.string(), data: z.array(z.number()) })),
    layout: z.string().optional(),
  }),
  description: "Vertical bar chart for categorical data",
  component: ({ props }) => {
    const mui = useMUITheme();
    const data = buildSeriesData(props.labels as string[], props.series as SeriesData[]);
    return (
      <Box sx={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={mui.gridColor} />
            <XAxis
              dataKey="name"
              tick={{ fill: mui.textColor, fontFamily: mui.fontFamily, fontSize: 12 }}
            />
            <YAxis tick={{ fill: mui.textColor, fontFamily: mui.fontFamily, fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {(props.series as SeriesData[]).map((s, idx) => (
              <Bar key={s.name} dataKey={s.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  },
});

export const LineChartComponent = defineComponent({
  name: "LineChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(z.object({ name: z.string(), data: z.array(z.number()) })),
  }),
  description: "Line chart for time series or trends",
  component: ({ props }) => {
    const mui = useMUITheme();
    const data = buildSeriesData(props.labels as string[], props.series as SeriesData[]);
    return (
      <Box sx={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={mui.gridColor} />
            <XAxis
              dataKey="name"
              tick={{ fill: mui.textColor, fontFamily: mui.fontFamily, fontSize: 12 }}
            />
            <YAxis tick={{ fill: mui.textColor, fontFamily: mui.fontFamily, fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {(props.series as SeriesData[]).map((s, idx) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  },
});

export const AreaChartComponent = defineComponent({
  name: "AreaChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(z.object({ name: z.string(), data: z.array(z.number()) })),
  }),
  description: "Area chart with filled regions",
  component: ({ props }) => {
    const mui = useMUITheme();
    const data = buildSeriesData(props.labels as string[], props.series as SeriesData[]);
    return (
      <Box sx={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={mui.gridColor} />
            <XAxis
              dataKey="name"
              tick={{ fill: mui.textColor, fontFamily: mui.fontFamily, fontSize: 12 }}
            />
            <YAxis tick={{ fill: mui.textColor, fontFamily: mui.fontFamily, fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {(props.series as SeriesData[]).map((s, idx) => (
              <Area
                key={s.name}
                type="monotone"
                dataKey={s.name}
                fill={CHART_COLORS[idx % CHART_COLORS.length]}
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    );
  },
});

export const PieChartComponent = defineComponent({
  name: "PieChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(z.number()),
  }),
  description: "Pie or donut chart for proportional data",
  component: ({ props }) => {
    const data: SliceData[] = (props.labels as string[]).map((name, i) => ({
      name,
      value: (props.series as number[])[i] ?? 0,
    }));
    return (
      <Box sx={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    );
  },
});
