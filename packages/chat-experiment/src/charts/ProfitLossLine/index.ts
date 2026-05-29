// ProfitLossLine public API
export {
  PROFIT_LOSS_LEGEND_ITEMS,
  ProfitLossLegend,
  type ProfitLossLegendProps,
} from "./components/ProfitLossLegend";
export {
  ProfitLossLegendHoverProvider,
  useProfitLossLegendHover,
} from "./components/ProfitLossLegendHover";
export {
  PROFIT_LOSS_NEGATIVE_COLOR,
  PROFIT_LOSS_POSITIVE_COLOR,
  PROFIT_LOSS_TOOLTIP_LABEL_FALLBACK,
  ProfitLossLine,
  profitLossColor,
  resolveProfitLossTooltipLabel,
  type ProfitLossLineProps,
} from "./ProfitLossLine";
export { splitProfitLossSegments, type ProfitLossSegment } from "./utils/profitLossSegments";
