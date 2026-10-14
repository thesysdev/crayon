import type { Library } from "@openuidev/react-lang";
import {
  ActionCards,
  BarList,
  ColumnChart,
  createKitLibrary,
  HeroMetric,
  InsightList,
  KpiStrip,
  RuleChips,
  TrendChart,
} from "../genui-lib";
import {
  AuditLog,
  ChampionList,
  CreditBurn,
  MemberTable,
  PeerBenchmark,
  ReclaimList,
  SeatInventory,
  SecurityPosture,
  TeamAdoption,
  ValueEstimate,
} from "./components";

// The usage kit's library: the dashboard base, the shared blocks, and the
// workspace admin's components. `npm run generate` writes its spec.
export function createUsageLibrary(base: Library): Library {
  return createKitLibrary(base, {
    group: {
      name: "Workspace usage",
      notes: [
        'Lead with HeroMetric(overview.hero, overview.heroTrend, overview.metrics, $metric) in a LargeCard and KpiStrip(overview.metrics, $metric) with RuleChips(overview.rules) in its own LargeCard row; declare $metric = "".',
        "Seats: SeatInventory, then ReclaimList for what to do about idle seats. Members: MemberTable. Teams: TeamAdoption. AI: CreditBurn, ColumnChart for intensity bands, BarList for use by feature or team. Value: ValueEstimate beside PeerBenchmark, and ChampionList. Collaboration: KpiStrip and BarList from get_collaboration. Security: SecurityPosture with AuditLog.",
        "Put a DashboardCardHeader before each of these components.",
      ],
    },
    components: [
      { component: HeroMetric, slots: ["LargeCard"] },
      { component: KpiStrip, slots: ["LargeCard"] },
      { component: RuleChips, slots: ["LargeCard", "MediumCard"] },
      { component: TrendChart, slots: ["MediumCard", "LargeCard"] },
      { component: ColumnChart, slots: ["MediumCard", "LargeCard"] },
      { component: BarList, slots: ["MediumCard", "LargeCard"] },
      { component: InsightList, slots: ["MediumCard", "LargeCard"] },
      { component: ActionCards, slots: ["LargeCard", "MediumCard"] },
      { component: SeatInventory, slots: ["LargeCard", "MediumCard"] },
      { component: ReclaimList, slots: ["LargeCard"] },
      { component: MemberTable, slots: ["LargeCard"] },
      { component: TeamAdoption, slots: ["LargeCard"] },
      { component: CreditBurn, slots: ["LargeCard", "MediumCard"] },
      { component: ValueEstimate, slots: ["LargeCard", "MediumCard"] },
      { component: PeerBenchmark, slots: ["MediumCard", "LargeCard"] },
      { component: SecurityPosture, slots: ["LargeCard", "MediumCard"] },
      { component: AuditLog, slots: ["MediumCard", "LargeCard"] },
      { component: ChampionList, slots: ["LargeCard", "MediumCard"] },
    ],
  });
}
