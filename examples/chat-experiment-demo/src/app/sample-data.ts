// Static sample datasets for the chart gallery. Shapes mirror the bklit-ui
// component docs so each ported chart receives data it expects.

import type { SankeyData } from "@openuidev/chat-experiment";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthDate(i: number): Date {
  return new Date(2025, i, 1);
}

export const lineData = MONTHS.map((_, i) => ({
  date: monthDate(i),
  users: Math.round(1200 + 600 * Math.sin(i / 1.8) + i * 70),
  pageviews: Math.round(2600 + 900 * Math.cos(i / 2.2) + i * 40),
}));

export const areaData = MONTHS.map((_, i) => ({
  date: monthDate(i),
  revenue: Math.round(12000 + 4200 * Math.sin(i / 2) + i * 350),
  costs: Math.round(8500 + 2200 * Math.cos(i / 2.4) + i * 180),
}));

export const barData = MONTHS.slice(0, 6).map((month, i) => ({
  month,
  revenue: [12000, 15500, 11000, 18500, 16800, 21200][i],
  profit: [4500, 5200, 3800, 7100, 5400, 8800][i],
}));

export const scatterData = MONTHS.map((_, i) => ({
  date: monthDate(i),
  sessions: Math.round(900 + 700 * Math.sin(i / 1.3) + (i % 3) * 120),
  conversions: Math.round(220 + 180 * Math.cos(i / 1.7) + (i % 4) * 30),
}));

export interface OHLC {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const ohlcData: OHLC[] = (() => {
  const points: OHLC[] = [];
  let prevClose = 100;
  for (let i = 0; i < 24; i++) {
    const open = prevClose;
    const drift = Math.sin(i / 2.5) * 4 + (i % 5 === 0 ? -3 : 1.5);
    const close = Math.max(40, open + drift);
    const high = Math.max(open, close) + 2 + (i % 3);
    const low = Math.min(open, close) - 2 - (i % 4);
    points.push({
      date: new Date(2025, 0, i + 1),
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
    });
    prevClose = close;
  }
  return points;
})();

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export const composedData = Array.from({ length: 12 }, (_, i) => ({
  date: monthDate(i),
  revenue: Math.round(14000 + 5000 * Math.sin(i / 2.1) + i * 300),
  runRate: Math.round(16000 + 3000 * Math.cos(i / 1.9)),
  units: Math.round(420 + 260 * Math.abs(Math.sin(i / 1.5))),
}));

export const funnelData = [
  { label: "Visitors", value: 12400, displayValue: "12.4k" },
  { label: "Leads", value: 6800, displayValue: "6.8k" },
  { label: "Qualified", value: 3200, displayValue: "3.2k" },
  { label: "Proposals", value: 1500, displayValue: "1.5k" },
  { label: "Closed", value: 620, displayValue: "620" },
];

export const pieData = [
  { label: "Electronics", value: 4250, color: "var(--chart-1)" },
  { label: "Clothing", value: 3120, color: "var(--chart-2)" },
  { label: "Food", value: 2100, color: "var(--chart-3)" },
  { label: "Home", value: 1650, color: "var(--chart-4)" },
  { label: "Other", value: 980, color: "var(--chart-5)" },
];

export const radarMetrics = [
  { key: "speed", label: "Speed" },
  { key: "power", label: "Power" },
  { key: "technique", label: "Technique" },
  { key: "stamina", label: "Stamina" },
  { key: "defense", label: "Defense" },
];

export const radarData = [
  {
    label: "Player A",
    color: "var(--chart-1)",
    values: { speed: 85, power: 70, technique: 90, stamina: 65, defense: 78 },
  },
  {
    label: "Player B",
    color: "var(--chart-3)",
    values: { speed: 65, power: 95, technique: 60, stamina: 88, defense: 70 },
  },
];

export const ringData = [
  { label: "Organic", value: 4250, maxValue: 5000, color: "var(--chart-1)" },
  { label: "Paid", value: 3120, maxValue: 5000, color: "var(--chart-2)" },
  { label: "Email", value: 2100, maxValue: 5000, color: "var(--chart-3)" },
];

export const sankeyData: SankeyData = {
  nodes: [
    { name: "Organic Search", category: "source" },
    { name: "Direct", category: "source" },
    { name: "Homepage", category: "landing" },
    { name: "Pricing", category: "landing" },
    { name: "Converted", category: "outcome" },
    { name: "Bounced", category: "outcome" },
  ],
  links: [
    { source: 0, target: 2, value: 100 },
    { source: 1, target: 3, value: 60 },
    { source: 0, target: 3, value: 40 },
    { source: 2, target: 4, value: 70 },
    { source: 2, target: 5, value: 30 },
    { source: 3, target: 4, value: 65 },
    { source: 3, target: 5, value: 35 },
  ],
};
