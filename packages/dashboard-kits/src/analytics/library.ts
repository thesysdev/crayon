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
  AccountHealth,
  ActivityHeatmap,
  EngagementMatrix,
  EventTable,
  ExperimentResults,
  FeatureAdoption,
  LifecycleChart,
  PowerUserCurve,
  UserPaths,
} from "./components";

// The product analytics kit's library: the dashboard base, the shared analytics
// blocks, and eight product components. `npm run generate` writes its spec.
export function createAnalyticsLibrary(base: Library): Library {
  return createKitLibrary(base, {
    group: {
      name: "Product analytics",
      notes: [
        'Lead every dashboard with one HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric) in a LargeCard; put the supporting KpiStrip(kpis.metrics, $metric) in its own LargeCard row. The shared $metric (declare $metric = "") makes each KPI tile a tab that shows its metric in the hero chart.',
        "Charts: TrendChart for anything over time, ColumnChart for counts per period or stacked composition, BarList for ranked categories, ShareBar for part-to-whole. Prefer them over LineChart, AreaChart, BarChart, and PieChart.",
        "InsightList: what changed and why. Beside the HeroMetric in a MediumCard with a limit (InsightList(insights.insights, 3)), or in its own LargeCard row.",
        "LifecycleChart: growth quality from new, returning, resurrecting, and dormant users. LargeCard only.",
        "ConversionFunnel: the signup-to-activation funnel.",
        "CohortGrid: weekly signup cohorts. LargeCard only. To compare plans, use TrendChart with get_retention_curves.",
        "PowerUserCurve: stickiness, as days active out of 7 or 28.",
        "EngagementMatrix: features by breadth and frequency. LargeCard only. FeatureAdoption is the ranked list for a MediumCard.",
        "ActivityHeatmap: when people use the product. LargeCard only.",
        "EventTable: the top tracked events with volume, reach, and change. LargeCard only; use it instead of a Table of events.",
        "UserPaths: what new users do after signing up.",
        "ExperimentResults and AccountHealth: LargeCard only.",
        "GoalPace: progress toward this month's signup goal, with the pace and the projected finish. Feeds from get_signup_goal.",
        "Tracker: a strip of days against a target. LargeCard reads best.",
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
      { component: LifecycleChart, slots: ["LargeCard"] },
      { component: PowerUserCurve, slots: ["MediumCard", "LargeCard"] },
      { component: EngagementMatrix, slots: ["LargeCard"] },
      { component: FeatureAdoption, slots: ["MediumCard", "LargeCard"] },
      { component: ActivityHeatmap, slots: ["LargeCard"] },
      { component: EventTable, slots: ["LargeCard"] },
      { component: UserPaths, slots: ["MediumCard", "LargeCard"] },
      { component: ExperimentResults, slots: ["LargeCard"] },
      { component: AccountHealth, slots: ["LargeCard"] },
    ],
  });
}
