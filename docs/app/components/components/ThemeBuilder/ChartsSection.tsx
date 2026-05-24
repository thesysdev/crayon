"use client";

import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  RadialChart,
  ScatterChart,
} from "@openuidev/react-ui";
import styles from "./realBlocksCanvas.module.css";

const MONTHLY_DATA = [
  { month: "Jan", desktop: 120, mobile: 80 },
  { month: "Feb", desktop: 220, mobile: 140 },
  { month: "Mar", desktop: 180, mobile: 110 },
  { month: "Apr", desktop: 260, mobile: 160 },
];

const PIE_DATA = [
  { category: "January", value: 1250 },
  { category: "February", value: 980 },
  { category: "March", value: 1450 },
  { category: "April", value: 1320 },
];

const RADIAL_DATA = [
  { month: "January", value: 1250 },
  { month: "February", value: 980 },
  { month: "March", value: 1450 },
  { month: "April", value: 1320 },
];

const SCATTER_DATA = [
  {
    name: "A school",
    data: [
      { x: 100, y: 200, z: 200 },
      { x: 120, y: 100, z: 260 },
      { x: 170, y: 300, z: 400 },
    ],
  },
  {
    name: "B school",
    data: [
      { x: 200, y: 180, z: 240 },
      { x: 180, y: 350, z: 220 },
      { x: 160, y: 320, z: 250 },
    ],
  },
];

const CHART_PALETTE = ["#1f7ecc", "#2a8fdf", "#3f9ae6", "#5ca9ed"];

function Block({ children }: { children: React.ReactNode }) {
  return <article className={styles.block}>{children}</article>;
}

export default function ChartsSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Charts</h2>
      <Block>
        <BarChart data={MONTHLY_DATA} categoryKey="month" />
      </Block>
      <Block>
        <LineChart data={MONTHLY_DATA} categoryKey="month" />
      </Block>
      <Block>
        <AreaChart data={MONTHLY_DATA} categoryKey="month" />
      </Block>
      <Block>
        <PieChart
          data={PIE_DATA}
          categoryKey="category"
          dataKey="value"
          variant="pie"
          format="percentage"
          legend
          legendVariant="stacked"
          minChartSize={296}
          maxChartSize={296}
          customPalette={CHART_PALETTE}
        />
      </Block>
      <Block>
        <PieChart
          data={PIE_DATA}
          categoryKey="category"
          dataKey="value"
          variant="donut"
          format="percentage"
          legend
          legendVariant="stacked"
          minChartSize={296}
          maxChartSize={296}
          customPalette={CHART_PALETTE}
        />
      </Block>
      <Block>
        <ScatterChart data={SCATTER_DATA} xAxisDataKey="x" yAxisDataKey="y" />
      </Block>
      <Block>
        <RadialChart data={RADIAL_DATA} categoryKey="month" dataKey="value" variant="circular" />
      </Block>
    </section>
  );
}
