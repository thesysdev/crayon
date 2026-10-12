import type { Library } from "@openuidev/react-lang";
import {
  BarList,
  CohortGrid,
  ColumnChart,
  ConversionFunnel,
  createKitLibrary,
  GoalPace,
  HeroMetric,
  InsightList,
  KpiStrip,
  ShareBar,
  Tracker,
  TrendChart,
} from "../genui-lib";
import {
  ChannelPerformance,
  CustomerSegments,
  InventoryAlerts,
  MoneyBreakdown,
  ProductLeaderboard,
  ProductPerformance,
} from "./components";

// The e-commerce kit's library: the dashboard base, the shared analytics
// blocks, and six store components. `npm run generate` writes its spec.
export function createEcommerceLibrary(base: Library): Library {
  return createKitLibrary(base, {
    group: {
      name: "E-commerce",
      notes: [
        'Lead every dashboard with one HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric) in a LargeCard; put the supporting KpiStrip(kpis.metrics, $metric) in its own LargeCard row. The shared $metric (declare $metric = "") makes each KPI tile a tab that shows its metric in the hero chart.',
        "Charts: TrendChart for anything over time, ColumnChart for counts per period or stacked composition, BarList for ranked categories, ShareBar for part-to-whole. Prefer them over LineChart, AreaChart, BarChart, and PieChart.",
        "InsightList: what changed and why. Beside the HeroMetric in a MediumCard with a limit (InsightList(insights.insights, 3)), or in its own LargeCard row.",
        "MoneyBreakdown: sales breakdown or contribution profit, in a MediumCard or LargeCard.",
        "ChannelPerformance: marketing channels with ROAS against target. LargeCard only.",
        "GoalPace: progress toward this month's goal, with the pace and the projected finish. Feeds from get_sales_goal.",
        "Tracker: a strip of days against a target, e.g. fulfillment within 48 hours. LargeCard reads best.",
        'Breakdowns whose items carry keys (sales by channel, device, or category) can filter the dashboard: pass the matching filter $binding last, e.g. ShareBar(byChannel.items, "currency", $channel) or BarList(byCategory.items, "currency", 8, "", $category).',
        "ConversionFunnel: purchase journey, checkout journey, or 1st-to-5th order progression.",
        "CohortGrid: first-order cohorts as LTV or repeat rate. LargeCard only.",
        "CustomerSegments: RFM segments. LargeCard only.",
        "ProductPerformance: full product table. LargeCard only. ProductLeaderboard is the compact ranked list for a MediumCard.",
        "InventoryAlerts: products below their reorder point.",
        "Put a DashboardCardHeader before each of these components.",
      ],
    },
    components: [
      { component: HeroMetric, slots: ["LargeCard"] },
      { component: TrendChart, slots: ["MediumCard", "LargeCard"] },
      { component: ColumnChart, slots: ["MediumCard", "LargeCard"] },
      { component: BarList, slots: ["MediumCard", "LargeCard"] },
      { component: ShareBar, slots: ["MediumCard", "LargeCard"] },
      { component: KpiStrip, slots: ["LargeCard"] },
      { component: GoalPace, slots: ["MediumCard", "LargeCard"] },
      { component: Tracker, slots: ["MediumCard", "LargeCard"] },
      { component: InsightList, slots: ["MediumCard", "LargeCard"] },
      { component: ConversionFunnel, slots: ["MediumCard", "LargeCard"] },
      { component: CohortGrid, slots: ["LargeCard"] },
      { component: MoneyBreakdown, slots: ["MediumCard", "LargeCard"] },
      { component: ChannelPerformance, slots: ["LargeCard"] },
      { component: CustomerSegments, slots: ["LargeCard"] },
      { component: ProductPerformance, slots: ["LargeCard"] },
      { component: ProductLeaderboard, slots: ["MediumCard", "LargeCard"] },
      { component: InventoryAlerts, slots: ["MediumCard", "LargeCard"] },
    ],
  });
}
