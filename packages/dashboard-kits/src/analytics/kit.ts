import type { KitDefinition } from "../core/kit";
import { analyticsTools } from "./tools";

const FILTERS = `filters = FilterBar([rangeFilter, platformFilter, planFilter])
rangeFilter = FilterSelect("range", "Period", [{value: "7d", label: "Last 7 days"}, {value: "30d", label: "Last 30 days"}, {value: "90d", label: "Last 90 days"}], $range)
platformFilter = FilterSelect("platform", "Platform", [{value: "all", label: "All platforms"}, {value: "web", label: "Web"}, {value: "ios", label: "iOS"}, {value: "android", label: "Android"}], $platform)
planFilter = FilterSelect("plan", "Plan", [{value: "all", label: "All plans"}, {value: "free", label: "Free"}, {value: "team", label: "Team"}, {value: "business", label: "Business"}], $plan)`;
const KPI_DEFAULTS = `{periodLabel: "", hero: {label: "Loading", value: "—"}, heroTrend: {labels: [], current: []}, metrics: []}`;
const SOURCES_DEFAULTS = `{labels: [], signups: [], activationRate: [], items: [], activation: []}`;

const PRODUCT_HEALTH = `root = Dashboard([header, section])
header = DashboardHeader("Product health", kpis.periodLabel)
$range = "30d"
$platform = "all"
$plan = "all"
section = Section([heroRow, kpiRow, usersRow, lifecycleRow], filters)
${FILTERS}
kpis = Query("get_usage_kpis", {range: $range, platform: $platform, plan: $plan}, ${KPI_DEFAULTS})
insights = Query("get_product_insights", {range: $range, platform: $platform, plan: $plan}, {insights: []})
heroRow = CardRow([heroCard, insightCard])
heroCard = LargeCard([hero])
$metric = ""
hero = HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric)
insightCard = MediumCard([insightHeader, insightList])
insightHeader = DashboardCardHeader("What changed", "Most important first")
insightList = InsightList(insights.insights, 3)
kpiRow = CardRow([kpiCard])
kpiCard = LargeCard([kpiStrip])
kpiStrip = KpiStrip(kpis.metrics, $metric)
active = Query("get_active_users", {range: $range, platform: $platform, plan: $plan}, {labels: [], dau: [], wau: [], mau: []})
sticky = Query("get_stickiness", {platform: $platform, plan: $plan, window: 7}, {window: 7, buckets: [], powerUserShare: "—"})
usersRow = CardRow([activeCard, stickyCard])
activeCard = LargeCard([activeHeader, activeChart])
activeHeader = DashboardCardHeader("Active users", "Daily, rolling 7-day, and rolling 28-day")
activeChart = TrendChart(active.labels, [{name: "MAU", values: active.mau}, {name: "WAU", values: active.wau}, {name: "DAU", values: active.dau}], "number", "line")
stickyCard = MediumCard([stickyHeader, stickyChart])
stickyHeader = DashboardCardHeader(sticky.powerUserShare, "Power users: active 5+ of the last 7 days", "number")
stickyChart = PowerUserCurve(sticky.buckets, sticky.window, sticky.powerUserShare)
life = Query("get_lifecycle", {platform: $platform, plan: $plan, weeks: 12}, {labels: [], newUsers: [], returning: [], resurrecting: [], dormant: [], quickRatio: "—"})
goal = Query("get_signup_goal", {platform: $platform}, {label: "", goal: 0, labels: [], cumulative: []})
lifecycleRow = CardRow([lifeCard, goalCard])
lifeCard = LargeCard([lifeHeader, lifeChart])
lifeHeader = DashboardCardHeader("Lifecycle", "Weekly new, returning, resurrecting, and dormant users")
lifeChart = LifecycleChart(life.labels, life.newUsers, life.returning, life.resurrecting, life.dormant, life.quickRatio)
goalCard = MediumCard([goalHeader, goalPace])
goalHeader = DashboardCardHeader("Monthly goal", "October signups against the pace needed to reach the goal")
goalPace = GoalPace(goal)`;

const ACTIVATION_AND_RETENTION = `root = Dashboard([header, section])
header = DashboardHeader("Activation and retention", "From signup to habit: who activates, and who stays")
$range = "30d"
$platform = "all"
$plan = "all"
section = Section([activationRow, cohortRow, pathRow], filters)
${FILTERS}
funnel = Query("get_activation_funnel", {range: $range, platform: $platform, plan: $plan}, {steps: [], activationRate: "—"})
curves = Query("get_retention_curves", {platform: $platform, weeks: 8}, {labels: [], all: [], free: [], team: [], business: []})
activationRow = CardRow([curvesCard, funnelCard])
curvesCard = LargeCard([curvesHeader, curvesChart])
curvesHeader = DashboardCardHeader("Retention by plan", "Percent of signups active N weeks later")
curvesChart = TrendChart(curves.labels, [{name: "Business", values: curves.business}, {name: "Team", values: curves.team}, {name: "Free", values: curves.free}, {name: "All users", values: curves.all, emphasis: "muted"}], "percent", "line")
funnelCard = MediumCard([funnelHeader, funnelChart])
funnelHeader = DashboardCardHeader(funnel.activationRate, "Week-1 activation of new signups", "number")
funnelChart = ConversionFunnel(funnel.steps)
cohorts = Query("get_retention_cohorts", {platform: $platform, plan: $plan, weeks: 8}, {periodLabels: [], cohorts: [], format: "percent"})
cohortRow = CardRow([cohortCard])
cohortCard = LargeCard([cohortHeader, cohortGrid])
cohortHeader = DashboardCardHeader("Weekly signup cohorts", "Percent of each cohort active in each later week; read down a column")
cohortGrid = CohortGrid(cohorts.cohorts, cohorts.periodLabels, cohorts.format, "Signups")
paths = Query("get_user_paths", {range: $range, platform: $platform}, {start: "", totalUsers: 0, paths: []})
sources = Query("get_signups_by_source", {range: $range, platform: $platform}, ${SOURCES_DEFAULTS})
pathRow = CardRow([pathCard, sourceCard])
pathCard = LargeCard([pathHeader, pathList])
pathHeader = DashboardCardHeader("First-session paths", "What new users do right after signing up, and how it ends")
pathList = UserPaths(paths.start, paths.totalUsers, paths.paths)
sourceCard = MediumCard([sourceHeader, sourceShare, sourceList])
sourceHeader = DashboardCardHeader("Signups by source", "Share of new signups, then how many of each activated")
sourceShare = ShareBar(sources.items, "number")
sourceList = BarList(sources.activation, "percent", 6, "Activated in week 1")`;

const ENGAGEMENT_AND_FEATURES = `root = Dashboard([header, section])
header = DashboardHeader("Engagement and features", "What people use, how often they come back, and when")
$range = "30d"
$platform = "all"
$plan = "all"
section = Section([matrixRow, rhythmRow, eventsRow], filters)
${FILTERS}
features = Query("get_feature_engagement", {range: $range, platform: $platform, plan: $plan}, {features: []})
matrixRow = CardRow([matrixCard, adoptionCard])
matrixCard = LargeCard([matrixHeader, matrix])
matrixHeader = DashboardCardHeader("Engagement matrix", "Breadth against frequency, sized by users; lines mark the medians")
matrix = EngagementMatrix(features.features)
adoptionCard = MediumCard([adoptionHeader, adoption])
adoptionHeader = DashboardCardHeader("Feature adoption", "Share of monthly active users, with change")
adoption = FeatureAdoption(features.features, 8)
heat = Query("get_activity_heatmap", {range: $range, platform: $platform, plan: $plan}, {hourLabels: [], days: []})
sticky = Query("get_stickiness", {platform: $platform, plan: $plan, window: 28}, {window: 28, buckets: [], powerUserShare: "—"})
rhythmRow = CardRow([heatCard, stickyCard])
heatCard = LargeCard([heatHeader, heatmap])
heatHeader = DashboardCardHeader("When people work", "Average events per hour by weekday, UTC")
heatmap = ActivityHeatmap(heat.days, heat.hourLabels)
stickyCard = MediumCard([stickyHeader, stickyChart])
stickyHeader = DashboardCardHeader(sticky.powerUserShare, "Active 20+ of the last 28 days", "number")
stickyChart = PowerUserCurve(sticky.buckets, sticky.window, sticky.powerUserShare)
top = Query("get_top_events", {range: $range, platform: $platform, limit: 8}, {events: []})
eventsRow = CardRow([eventsCard])
eventsCard = LargeCard([eventsHeader, eventsTable])
eventsHeader = DashboardCardHeader("Top events", "Volume, reach, and change against the prior period")
eventsTable = EventTable(top.events)`;

const EXPERIMENTS_AND_ACCOUNTS = `root = Dashboard([header, section])
header = DashboardHeader("Experiments and accounts", "What we are testing, and which paying workspaces need attention")
$status = "all"
$accountPlan = "all"
section = Section([experimentRow, accountRow], filters)
filters = FilterBar([statusFilter, accountPlanFilter])
statusFilter = FilterSelect("status", "Experiments", [{value: "all", label: "All experiments"}, {value: "running", label: "Running"}, {value: "completed", label: "Completed"}], $status)
accountPlanFilter = FilterSelect("accountPlan", "Account plan", [{value: "all", label: "Team and Business"}, {value: "team", label: "Team"}, {value: "business", label: "Business"}], $accountPlan)
experiments = Query("get_experiments", {status: $status}, {experiments: []})
experimentRow = CardRow([experimentCard])
experimentCard = LargeCard([experimentHeader, experimentList])
experimentHeader = DashboardCardHeader("Experiments", "Lift against control with 95% confidence intervals")
experimentList = ExperimentResults(experiments.experiments)
accounts = Query("get_account_health", {plan: $accountPlan, sort: "risk", limit: 8}, {metrics: [], accounts: []})
accountRow = CardRow([accountCard])
accountCard = LargeCard([accountHeader, accountStrip, accountTable])
accountHeader = DashboardCardHeader("Paying workspaces", "Health across Team and Business, lowest health first")
accountStrip = KpiStrip(accounts.metrics)
accountTable = AccountHealth(accounts.accounts)`;

export const analyticsKit: KitDefinition = {
  id: "analytics",
  name: "Product analytics",
  tagline:
    "Active users, lifecycle, activation, retention cohorts, stickiness, feature engagement, experiments, and account health for a SaaS product.",
  preamble:
    "You build product analytics dashboards for the team behind Relay, a team workspace app with boards, tasks, and docs, sold on Free, Team, and Business plans and used on web, iOS, and Android. You are generating an openui-lang dashboard.",
  rules: [
    'Filters: $range ("7d" | "30d" | "90d", default "30d"), $platform ("all" | "web" | "ios" | "android"), $plan ("all" | "free" | "team" | "business"). get_lifecycle, get_retention_cohorts, get_retention_curves, and get_stickiness take no range. Only add filters that the dashboard\'s tools accept.',
    "Definitions: DAU/WAU/MAU = users active in the last 1, 7, and 28 days; stickiness = DAU/MAU; activated = 3+ active days in the first week; lifecycle buckets are new, returning (active last week too), resurrecting (back after a gap), and dormant (active last week, not this week); quick ratio = (new + resurrecting) ÷ dormant; breadth = percent of monthly active users using a feature; frequency = days per week they use it.",
    'Layout: open overview dashboards with a hero row, CardRow([LargeCard([HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric)]), MediumCard([...])]), where the MediumCard explains the hero (InsightList with a limit, or a funnel). Then a LargeCard row with KpiStrip(kpis.metrics, $metric). Declare $metric = "" so selecting a KPI tile shows that metric in the hero chart. Then detail rows of a LargeCard and a MediumCard.',
    'Use a KPI tool\'s periodLabel as the DashboardHeader subtitle: DashboardHeader("Product health", kpis.periodLabel). KPI query defaults: {periodLabel: "", hero: {label: "Loading", value: "—"}, heroTrend: {labels: [], current: []}, metrics: []}.',
    'Charts: TrendChart over time (DAU/WAU/MAU, retention curves by plan with "All users" muted), ColumnChart for per-period counts, BarList for ranked categories (activation by source), ShareBar for part-to-whole (signups by source). Do not use LineChart, AreaChart, BarChart, or PieChart.',
    "Match questions to tools: overview → get_usage_kpis, get_product_insights, get_active_users, get_lifecycle; activation → get_activation_funnel, get_user_paths, get_signups_by_source; retention → get_retention_cohorts, get_retention_curves; engagement → get_stickiness, get_feature_engagement, get_activity_heatmap, get_top_events; experiments → get_experiments; accounts and churn risk → get_account_health.",
    'Give every card except the hero a DashboardCardHeader whose subtitle says what is measured and against what. When a card leads with one number, make it the title with titleType "number", e.g. DashboardCardHeader(sticky.powerUserShare, "Power users: active 5+ of the last 7 days", "number").',
  ],
  tools: analyticsTools,
  gallery: [
    {
      title: "Product health",
      description:
        "Daily active users hero beside what changed, usage KPIs, DAU/WAU/MAU, the power user curve, weekly lifecycle with quick ratio, and signups by source.",
      program: PRODUCT_HEALTH,
    },
    {
      title: "Activation and retention",
      description:
        "Retention curves by plan beside the activation funnel, weekly signup cohorts, first-session paths, and activation by signup source.",
      program: ACTIVATION_AND_RETENTION,
    },
    {
      title: "Engagement and features",
      description:
        "Engagement matrix and feature adoption, activity by weekday and hour, the 28-day power user curve, and top events.",
      program: ENGAGEMENT_AND_FEATURES,
    },
    {
      title: "Experiments and accounts",
      description:
        "A/B tests with lift, confidence intervals, and decisions; paying workspace KPIs and the accounts most at risk.",
      program: EXPERIMENTS_AND_ACCOUNTS,
    },
  ],
  starters: [
    "How healthy is product usage this month, and what changed?",
    "Are new users activating and sticking around? Compare the plans.",
    "Which features are core and which should we review? When do people use the app?",
    "Show our experiments and the paying workspaces at risk of churning.",
  ],
};
