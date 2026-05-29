// Public chart API — faithful port of bklit-ui's charts/index.ts barrel.
// Paths are relative to this charts/ directory and match the flat layout here.

// Re-export visx gradient and pattern components for bar fill styling
export {
  GradientDarkgreenGreen,
  GradientLightgreenGreen,
  GradientOrangeRed,
  GradientPinkBlue,
  GradientPinkRed,
  GradientPurpleOrange,
  GradientPurpleTeal,
  GradientSteelPurple,
  GradientTealBlue,
  LinearGradient,
  RadialGradient,
} from "@visx/gradient";
// Area chart components
export { Area, type AreaProps } from "./area";
export { AreaChart, type AreaChartProps } from "./area-chart";
// Bar chart components
export { Bar, type BarAnimationType, type BarLineCap, type BarProps } from "./bar";
export { BarChart, type BarChartProps, type BarOrientation } from "./bar-chart";
export { BarXAxis, type BarXAxisProps } from "./bar-x-axis";
export { BarYAxis, type BarYAxisProps } from "./bar-y-axis";
export { Candlestick, type CandlestickProps } from "./candlestick";
export {
  CandlestickChart,
  type CandlestickChartProps,
  type OHLCDataPoint,
} from "./candlestick-chart";
export { ChartBrush, type ChartBrushProps, type ChartBrushSelection } from "./chart-brush";
export {
  chartCenterContainerClassName,
  chartCenterLabelClassName,
  chartCenterValueClassName,
} from "./chart-center-typography";
export {
  ChartConfigProvider,
  DEFAULT_CHART_CONFIG,
  useChartConfig,
  type ChartConfigProviderProps,
  type ChartConfigValue,
  type SpringConfig,
} from "./chart-config-context";
export {
  ChartProvider,
  chartCssVars,
  defaultScatterColors,
  useChart,
  useChartHover,
  useChartStable,
  type ChartContextValue,
  type ChartHoverContextValue,
  type ChartStableContextValue,
  type LineConfig,
  type Margin,
  type TooltipData,
} from "./chart-context";
// Legacy legend component (backward compatibility)
export { ChartLegend, type ChartLegendProps, type LegendItem } from "./chart-legend";
export { ChartRevealClip, type ChartRevealClipProps } from "./chart-reveal-clip";
export {
  ChartStatFlow,
  defaultChartStatFlowFormat,
  type ChartStatFlowFormat,
  type ChartStatFlowProps,
} from "./chart-stat-flow";
// Choropleth chart components
export {
  ChoroplethChart,
  ChoroplethFeatureComponent,
  ChoroplethGraticule,
  ChoroplethProvider,
  ChoroplethTooltip,
  choroplethCssVars,
  defaultChoroplethColors,
  useChoropleth,
  useChoroplethZoom,
  type ChoroplethChartProps,
  type ChoroplethContextValue,
  type ChoroplethFeature,
  type ChoroplethFeatureProperties,
  type ChoroplethFeatureProps,
  type ChoroplethGraticuleProps,
  type ChoroplethTooltipData,
  type ChoroplethTooltipProps,
  type TransformMatrix,
} from "./choropleth";
// Composed time-series (line + area + SeriesBar on shared time scale)
export { ComposedChart, type ComposedChartProps } from "./composed-chart";
// Funnel chart components
export {
  FunnelChart,
  type FunnelChartProps,
  type FunnelGradientStop,
  type FunnelStage,
} from "./funnel-chart";
// Gauge chart
export { Gauge, type GaugeProps } from "./gauge";
// Shared chart elements
export { Grid, type GridProps } from "./grid";
// Composable legend components
export {
  Legend,
  LegendItem as LegendItemComponent,
  LegendLabel,
  LegendMarker,
  LegendProgress,
  LegendValue,
  legendCssVars,
  useLegend,
  useLegendItem,
  type LegendContextValue,
  type LegendItemContextValue,
  type LegendItemData,
  type LegendItemProps,
  type LegendLabelProps,
  type LegendMarkerProps,
  type LegendProgressProps,
  type LegendProps,
  type LegendValueProps,
} from "./legend";
// Line chart components
export { Line, type LineProps } from "./line";
export { LineChart, type LineChartProps } from "./line-chart";
export {
  LiveLine,
  detectMomentum,
  type LiveLineProps,
  type Momentum,
  type MomentumColors,
} from "./live-line";
// Live line chart (real-time streaming)
export { LiveLineChart, type LiveLineChartProps, type LiveLinePoint } from "./live-line-chart";
export { LiveXAxis, type LiveXAxisProps } from "./live-x-axis";
export { LiveYAxis, type LiveYAxisProps } from "./live-y-axis";
// Marker components
export {
  ChartMarkers,
  MarkerGroup,
  MarkerTooltipContent,
  useActiveMarkers,
  type ChartMarker,
  type ChartMarkersProps,
  type MarkerGroupProps,
  type MarkerTooltipContentProps,
} from "./markers";
export { PatternArea, type PatternAreaProps } from "./pattern-area";
// Pie chart components
export { PieCenter, type PieCenterProps } from "./pie-center";
export { PieCenterShell, type PieCenterShellProps } from "./pie-center-shell";
export { DEFAULT_HOVER_OFFSET, PieChart, type PieChartProps } from "./pie-chart";
export {
  PieProvider,
  defaultPieColors,
  pieCssVars,
  usePie,
  type PieArcData,
  type PieContextValue,
  type PieData,
} from "./pie-context";
export { PieSlice, type PieSliceHoverEffect, type PieSliceProps } from "./pie-slice";
// Profit/loss line (sign-colored segments on LineChart)
export {
  PROFIT_LOSS_LEGEND_ITEMS,
  ProfitLossLegend,
  type ProfitLossLegendProps,
} from "./profit-loss-legend";
export {
  ProfitLossLegendHoverProvider,
  useProfitLossLegendHover,
} from "./profit-loss-legend-hover";
export {
  PROFIT_LOSS_NEGATIVE_COLOR,
  PROFIT_LOSS_POSITIVE_COLOR,
  PROFIT_LOSS_TOOLTIP_LABEL_FALLBACK,
  ProfitLossLine,
  profitLossColor,
  resolveProfitLossTooltipLabel,
  type ProfitLossLineProps,
} from "./profit-loss-line";
export { splitProfitLossSegments, type ProfitLossSegment } from "./profit-loss-segments";
// Radar chart components
export { RadarArea, type RadarAreaProps } from "./radar-area";
export { RadarAxis, type RadarAxisProps } from "./radar-axis";
export { RadarChart, type RadarChartProps } from "./radar-chart";
export {
  RadarProvider,
  defaultRadarColors,
  radarCssVars,
  useRadar,
  type RadarContextValue,
  type RadarData,
  type RadarMetric,
} from "./radar-context";
export { RadarGrid, type RadarGridProps } from "./radar-grid";
export { RadarLabels, type RadarLabelsProps } from "./radar-labels";
// Ring chart components
export { Ring, type RingLineCap, type RingProps } from "./ring";
export { RingCenter, type RingCenterProps } from "./ring-center";
export { RingChart, type RingChartProps } from "./ring-chart";
export {
  RingProvider,
  defaultRingColors,
  ringCssVars,
  useRing,
  type RingContextValue,
  type RingData,
} from "./ring-context";
// Sankey chart components
export {
  SankeyChart,
  SankeyLink,
  SankeyNode,
  SankeyProvider,
  SankeyTooltip,
  sankeyCssVars,
  useSankey,
  type SankeyChartProps,
  type SankeyContextValue,
  type SankeyData,
  type SankeyLinkDatum,
  type SankeyLinkProps,
  type SankeyNodeDatum,
  type SankeyNodeProps,
  type SankeyTooltipData,
  type SankeyTooltipProps,
} from "./sankey";
// Scatter chart components
export { Scatter, type ScatterProps } from "./scatter";
export { ScatterChart, type ScatterChartProps } from "./scatter-chart";
// Segment selection components
export {
  SegmentBackground,
  SegmentLineFrom,
  SegmentLineTo,
  type SegmentBackgroundProps,
  type SegmentLineProps,
  type SegmentLineVariant,
} from "./segment";
// Series bar (time-based columns for ComposedChart)
export { SeriesBar, type SeriesBarProps } from "./series-bar";
export { SeriesMarkers, type SeriesMarkersProps } from "./series-markers";
export {
  SeriesPointMarker,
  getSeriesMarkerVisualExtent,
  type SeriesPointMarkerProps,
  type SeriesPointMarkerStyle,
} from "./series-point-marker";
// Tooltip components
export {
  ChartTooltip,
  DateTicker,
  TooltipBox,
  TooltipContent,
  TooltipDot,
  TooltipIndicator,
  type ChartTooltipProps,
  type DateTickerProps,
  type IndicatorWidth,
  type TooltipBoxProps,
  type TooltipContentProps,
  type TooltipDotProps,
  type TooltipIndicatorProps,
  type TooltipRow,
} from "./tooltip";
// Chart interaction hook
export { useChartInteraction, type ChartSelection } from "./use-chart-interaction";
export { PatternCircles, PatternHexagons, PatternLines, PatternWaves } from "./visx-pattern";
export { XAxis, type XAxisProps } from "./x-axis";
export { YAxis, type YAxisProps } from "./y-axis";
