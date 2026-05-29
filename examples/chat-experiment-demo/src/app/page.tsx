"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  BarXAxis,
  Candlestick,
  CandlestickChart,
  ChartTooltip,
  ComposedChart,
  FunnelChart,
  Gauge,
  Grid,
  Line,
  LineChart,
  PieCenter,
  PieChart,
  PieSlice,
  RadarArea,
  RadarAxis,
  RadarChart,
  RadarGrid,
  RadarLabels,
  Ring,
  RingCenter,
  RingChart,
  Scatter,
  ScatterChart,
  SeriesBar,
  XAxis,
} from "@openuidev/chat-experiment";
import {
  areaData,
  barData,
  composedData,
  funnelData,
  lineData,
  ohlcData,
  pieData,
  radarData,
  radarMetrics,
  ringData,
  scatterData,
} from "./sample-data";

function Card({
  title,
  desc,
  wide,
  children,
}: {
  title: string;
  desc: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={wide ? "card card--wide" : "card"}>
      <h2 className="card__title">{title}</h2>
      <p className="card__desc">{desc}</p>
      <div className="card__chart">{children}</div>
    </section>
  );
}

function Centered({
  height = 280,
  children,
}: {
  height?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height,
      }}
    >
      {children}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <main className="gallery">
      <header className="gallery__header">
        <h1 className="gallery__title">@openuidev/chat-experiment</h1>
        <p className="gallery__subtitle">
          A faithful local port of bklit-ui charts (Visx + Motion + d3 +
          NumberFlow). Hover, crosshair, spring entrance, clip-path reveal, and
          streaming interactions. Every family below is exercised with sample
          data.
        </p>
      </header>

      <div className="gallery__grid">
        <Card desc="Clip-path reveal + crosshair tooltip on hover." title="Line">
          <LineChart data={lineData}>
            <Grid horizontal />
            <Line dataKey="users" stroke="var(--chart-line-primary)" />
            <Line dataKey="pageviews" stroke="var(--chart-line-secondary)" />
            <XAxis />
            <ChartTooltip />
          </LineChart>
        </Card>

        <Card desc="Stacked gradient areas with hover tooltip." title="Area">
          <AreaChart data={areaData}>
            <Grid horizontal />
            <Area dataKey="revenue" fill="var(--chart-line-primary)" />
            <Area dataKey="costs" fill="var(--chart-line-secondary)" />
            <XAxis />
            <ChartTooltip />
          </AreaChart>
        </Card>

        <Card desc="Spring entrance + grouped bars, hover dim." title="Bar">
          <BarChart data={barData} xDataKey="month">
            <Grid horizontal />
            <Bar
              dataKey="revenue"
              fill="var(--chart-line-primary)"
              lineCap="round"
            />
            <Bar
              dataKey="profit"
              fill="var(--chart-line-secondary)"
              lineCap="round"
            />
            <BarXAxis />
            <ChartTooltip />
          </BarChart>
        </Card>

        <Card desc="Ring markers, fade/blur on hover." title="Scatter">
          <ScatterChart data={scatterData}>
            <Grid horizontal />
            <Scatter dataKey="sessions" />
            <Scatter dataKey="conversions" />
            <XAxis />
            <ChartTooltip />
          </ScatterChart>
        </Card>

        <Card desc="OHLC candles with entrance animation." title="Candlestick">
          <CandlestickChart data={ohlcData}>
            <Grid horizontal />
            <Candlestick fadedOpacity={0.25} />
            <XAxis />
            <ChartTooltip />
          </CandlestickChart>
        </Card>

        <Card
          desc="Mixed marks (area + bars + line) on one time axis."
          title="Composed"
        >
          <ComposedChart data={composedData} maxBarSize={28} xDataKey="date">
            <Grid horizontal />
            <Area dataKey="runRate" fill="var(--chart-4)" fillOpacity={0.32} />
            <SeriesBar dataKey="units" fill="var(--chart-3)" radius={4} />
            <Line dataKey="revenue" stroke="var(--chart-1)" />
            <ChartTooltip showCrosshair={false} />
            <XAxis numTicks={6} />
          </ComposedChart>
        </Card>

        <Card desc="Animated donut slices + NumberFlow center." title="Pie / Donut">
          <Centered>
            <PieChart data={pieData} innerRadius={70} size={240}>
              {pieData.map((_, index) => (
                <PieSlice index={index} key={index} />
              ))}
              <PieCenter defaultLabel="Total" />
            </PieChart>
          </Centered>
        </Card>

        <Card desc="Multi-ring progress arcs + center total." title="Ring">
          <Centered>
            <RingChart data={ringData} size={240}>
              {ringData.map((item, index) => (
                <Ring index={index} key={item.label} />
              ))}
              <RingCenter defaultLabel="Total Sessions" />
            </RingChart>
          </Centered>
        </Card>

        <Card desc="Animated polygons, per-axis hover." title="Radar">
          <Centered height={340}>
            <RadarChart data={radarData} metrics={radarMetrics} size={300}>
              <RadarGrid />
              <RadarAxis />
              <RadarLabels />
              {radarData.map((item, index) => (
                <RadarArea index={index} key={item.label} />
              ))}
            </RadarChart>
          </Centered>
        </Card>

        <Card desc="Notch arc + NumberFlow center value." title="Gauge">
          <Centered height={260}>
            <Gauge
              centerValue={428_000}
              defaultLabel="ARR run rate"
              formatOptions={{
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }}
              inactiveFillOpacity={0.4}
              spacing={25}
              value={66}
            />
          </Centered>
        </Card>

        <Card desc="Staggered entrance + halo rings, hover." title="Funnel">
          <div style={{ height: 280 }}>
            <FunnelChart color="var(--chart-1)" data={funnelData} layers={3} />
          </div>
        </Card>
      </div>
    </main>
  );
}
