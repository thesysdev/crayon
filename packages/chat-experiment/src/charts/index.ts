// Public chart API. Components are organized under core/ (engine), primitives/
// (shared visual building blocks), and families/<chart>/ (one folder per chart).

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
export { Area, type AreaProps } from "./families/area/area";
export { AreaChart, type AreaChartProps } from "./families/area/area-chart";
// Bar chart components
export {
  chartCenterContainerClassName,
  chartCenterLabelClassName,
  chartCenterValueClassName,
} from "./core/chart-center-typography";
export {
  ChartConfigProvider,
  DEFAULT_CHART_CONFIG,
  useChartConfig,
  type ChartConfigProviderProps,
  type ChartConfigValue,
  type SpringConfig,
} from "./core/chart-config-context";
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
} from "./core/chart-context";
export { Bar, type BarAnimationType, type BarLineCap, type BarProps } from "./families/bar/bar";
export { BarChart, type BarChartProps, type BarOrientation } from "./families/bar/bar-chart";
export { BarXAxis, type BarXAxisProps } from "./families/bar/bar-x-axis";
export { BarYAxis, type BarYAxisProps } from "./families/bar/bar-y-axis";
export { Candlestick, type CandlestickProps } from "./families/candlestick/candlestick";
export {
  CandlestickChart,
  type CandlestickChartProps,
  type OHLCDataPoint,
} from "./families/candlestick/candlestick-chart";
export {
  ChartBrush,
  type ChartBrushProps,
  type ChartBrushSelection,
} from "./primitives/chart-brush";
// Legacy legend component (backward compatibility)
export { ChartRevealClip, type ChartRevealClipProps } from "./core/chart-reveal-clip";
export { ChartLegend, type ChartLegendProps, type LegendItem } from "./primitives/chart-legend";
export {
  ChartStatFlow,
  defaultChartStatFlowFormat,
  type ChartStatFlowFormat,
  type ChartStatFlowProps,
} from "./primitives/chart-stat-flow";
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
} from "./families/choropleth";
// Composed time-series (line + area + SeriesBar on shared time scale)
export { ComposedChart, type ComposedChartProps } from "./families/composed/composed-chart";
// Funnel chart components
export {
  FunnelChart,
  type FunnelChartProps,
  type FunnelGradientStop,
  type FunnelStage,
} from "./families/funnel/funnel-chart";
// Gauge chart
export { Gauge, type GaugeProps } from "./families/gauge/gauge";
// Shared chart elements
export { Grid, type GridProps } from "./primitives/grid";
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
} from "./primitives/legend";
// Line chart components
export { Line, type LineProps } from "./families/line/line";
export { LineChart, type LineChartProps } from "./families/line/line-chart";
export {
  LiveLine,
  detectMomentum,
  type LiveLineProps,
  type Momentum,
  type MomentumColors,
} from "./families/live/live-line";
// Live line chart (real-time streaming)
export {
  LiveLineChart,
  type LiveLineChartProps,
  type LiveLinePoint,
} from "./families/live/live-line-chart";
export { LiveXAxis, type LiveXAxisProps } from "./families/live/live-x-axis";
export { LiveYAxis, type LiveYAxisProps } from "./families/live/live-y-axis";
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
} from "./primitives/markers";
export { PatternArea, type PatternAreaProps } from "./primitives/pattern-area";
// Pie chart components
export { PieCenterShell, type PieCenterShellProps } from "./core/pie-center-shell";
export { PieCenter, type PieCenterProps } from "./families/pie/pie-center";
export { DEFAULT_HOVER_OFFSET, PieChart, type PieChartProps } from "./families/pie/pie-chart";
export {
  PieProvider,
  defaultPieColors,
  pieCssVars,
  usePie,
  type PieArcData,
  type PieContextValue,
  type PieData,
} from "./families/pie/pie-context";
export { PieSlice, type PieSliceHoverEffect, type PieSliceProps } from "./families/pie/pie-slice";
// Profit/loss line (sign-colored segments on LineChart)
export {
  PROFIT_LOSS_LEGEND_ITEMS,
  ProfitLossLegend,
  type ProfitLossLegendProps,
} from "./families/profit-loss/profit-loss-legend";
export {
  ProfitLossLegendHoverProvider,
  useProfitLossLegendHover,
} from "./families/profit-loss/profit-loss-legend-hover";
export {
  PROFIT_LOSS_NEGATIVE_COLOR,
  PROFIT_LOSS_POSITIVE_COLOR,
  PROFIT_LOSS_TOOLTIP_LABEL_FALLBACK,
  ProfitLossLine,
  profitLossColor,
  resolveProfitLossTooltipLabel,
  type ProfitLossLineProps,
} from "./families/profit-loss/profit-loss-line";
export {
  splitProfitLossSegments,
  type ProfitLossSegment,
} from "./families/profit-loss/profit-loss-segments";
// Radar chart components
export { RadarArea, type RadarAreaProps } from "./families/radar/radar-area";
export { RadarAxis, type RadarAxisProps } from "./families/radar/radar-axis";
export { RadarChart, type RadarChartProps } from "./families/radar/radar-chart";
export {
  RadarProvider,
  defaultRadarColors,
  radarCssVars,
  useRadar,
  type RadarContextValue,
  type RadarData,
  type RadarMetric,
} from "./families/radar/radar-context";
export { RadarGrid, type RadarGridProps } from "./families/radar/radar-grid";
export { RadarLabels, type RadarLabelsProps } from "./families/radar/radar-labels";
// Ring chart components
export { Ring, type RingLineCap, type RingProps } from "./families/ring/ring";
export { RingCenter, type RingCenterProps } from "./families/ring/ring-center";
export { RingChart, type RingChartProps } from "./families/ring/ring-chart";
export {
  RingProvider,
  defaultRingColors,
  ringCssVars,
  useRing,
  type RingContextValue,
  type RingData,
} from "./families/ring/ring-context";
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
} from "./families/sankey";
// Scatter chart components
export { Scatter, type ScatterProps } from "./families/scatter/scatter";
export { ScatterChart, type ScatterChartProps } from "./families/scatter/scatter-chart";
// Segment selection components
export {
  SegmentBackground,
  SegmentLineFrom,
  SegmentLineTo,
  type SegmentBackgroundProps,
  type SegmentLineProps,
  type SegmentLineVariant,
} from "./primitives/segment";
// Series bar (time-based columns for ComposedChart)
export { SeriesBar, type SeriesBarProps } from "./families/bar/series-bar";
export { SeriesMarkers, type SeriesMarkersProps } from "./primitives/series-markers";
export {
  SeriesPointMarker,
  getSeriesMarkerVisualExtent,
  type SeriesPointMarkerProps,
  type SeriesPointMarkerStyle,
} from "./primitives/series-point-marker";
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
} from "./primitives/tooltip";
// Chart interaction hook
export { useChartInteraction, type ChartSelection } from "./core/use-chart-interaction";
export {
  PatternCircles,
  PatternHexagons,
  PatternLines,
  PatternWaves,
} from "./primitives/visx-pattern";
export { XAxis, type XAxisProps } from "./primitives/x-axis";
export { YAxis, type YAxisProps } from "./primitives/y-axis";
