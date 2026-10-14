import type { KitDefinition } from "../core/kit";
import { glossary } from "./metrics";
import { usageTools } from "./tools";

const WORKSPACE_FILTER = `workspaceFilter = FilterSelect("workspace", "Workspace", [{value: "brightline", label: "Brightline Health"}, {value: "kestrel", label: "Kestrel Labs"}, {value: "bluefin", label: "Bluefin Studio"}], $workspace)`;
const WINDOW_FILTER = `windowFilter = FilterSelect("window", "Window", [{value: "7d", label: "Last 7 days"}, {value: "28d", label: "Last 28 days"}, {value: "90d", label: "Last 90 days"}], $window)`;
const OVERVIEW_DEFAULTS = `{periodLabel: "", workspaceLabel: "", hero: {label: "Loading", value: "—"}, heroTrend: {labels: [], current: []}, metrics: [], rules: []}`;
const SEATS_DEFAULTS = `{paid: 0, guests: 0, states: [], metrics: [], forecast: ""}`;
const MEMBERS_DEFAULTS = `{rows: [], total: 0, rule: "", teams: [], saving: ""}`;

const WORKSPACE_OVERVIEW = `root = Dashboard([header, section])
header = DashboardHeader("Workspace overview", overview.workspaceLabel)
$workspace = "brightline"
$window = "28d"
$metric = ""
section = Section([heroRow, kpiRow, activityRow, teamRow], filters)
filters = FilterBar([workspaceFilter, windowFilter])
${WORKSPACE_FILTER}
${WINDOW_FILTER}
overview = Query("get_workspace_overview", {workspace: $workspace, window: $window}, ${OVERVIEW_DEFAULTS})
insights = Query("get_usage_insights", {workspace: $workspace, window: $window}, {insights: []})
heroRow = CardRow([heroCard, insightCard])
heroCard = LargeCard([hero])
hero = HeroMetric(overview.hero, overview.heroTrend, overview.metrics, $metric)
insightCard = MediumCard([insightHeader, insightList])
insightHeader = DashboardCardHeader("Needs attention", "Most important first")
insightList = InsightList(insights.insights, 3)
kpiRow = CardRow([kpiCard])
kpiCard = LargeCard([kpiStrip, kpiRules])
kpiStrip = KpiStrip(overview.metrics, $metric)
kpiRules = RuleChips(overview.rules)
activity = Query("get_activity", {workspace: $workspace, window: $window}, {labels: [], dau: [], wau: [], mau: [], events: [], rule: ""})
seats = Query("get_seat_inventory", {workspace: $workspace}, ${SEATS_DEFAULTS})
activityRow = CardRow([activityCard, seatCard])
activityCard = LargeCard([activityHeader, activityChart])
activityHeader = DashboardCardHeader("Active members", activity.rule)
activityChart = TrendChart(activity.labels, [{name: "28 days", values: activity.mau}, {name: "7 days", values: activity.wau}, {name: "Today", values: activity.dau}], "number", "line", activity.events, true)
seatCard = MediumCard([seatHeader, seatBar])
seatHeader = DashboardCardHeader("Seats", seats.forecast)
seatBar = SeatInventory(seats.states, seats.paid)
teams = Query("get_team_adoption", {workspace: $workspace, window: $window}, {rows: [], note: ""})
teamRow = CardRow([teamCard])
teamCard = LargeCard([teamHeader, teamTable])
teamHeader = DashboardCardHeader("Adoption by team", teams.note)
teamTable = TeamAdoption(teams.rows)`;

const SEATS_AND_RENEWAL = `root = Dashboard([header, section])
header = DashboardHeader("Seats and renewal", seats.forecast)
$workspace = "brightline"
section = Section([seatRow, reclaimRow, inviteRow], filters)
filters = FilterBar([workspaceFilter])
${WORKSPACE_FILTER}
seats = Query("get_seat_inventory", {workspace: $workspace}, ${SEATS_DEFAULTS})
actions = Query("get_admin_actions", {workspace: $workspace}, {actions: []})
seatRow = CardRow([seatCard, actionCard])
seatCard = LargeCard([seatHeader, seatStrip, seatBar])
seatHeader = DashboardCardHeader("Where every paid seat is", "Inactive after 30 days without activity, dormant after 90; guests hold no paid seat")
seatStrip = KpiStrip(seats.metrics)
seatBar = SeatInventory(seats.states, seats.paid)
actionCard = MediumCard([actionHeader, actionList])
actionHeader = DashboardCardHeader("What to do", "Biggest saving first; approving only logs it")
actionList = ActionCards(actions.actions)
reclaim = Query("get_members", {workspace: $workspace, view: "reclaim", limit: 100}, ${MEMBERS_DEFAULTS})
reclaimRow = CardRow([reclaimCard])
reclaimCard = LargeCard([reclaimHeader, reclaimList])
reclaimHeader = DashboardCardHeader(reclaim.saving, "Seats to reclaim, longest idle first", "number")
reclaimList = ReclaimList(reclaim.rows, reclaim.rule)
invites = Query("get_invites", {workspace: $workspace}, {items: [], metrics: [], note: ""})
inviteRow = CardRow([inviteCard])
inviteCard = LargeCard([inviteHeader, inviteStrip, inviteList])
inviteHeader = DashboardCardHeader("Invites and new members", invites.note)
inviteStrip = KpiStrip(invites.metrics)
inviteList = BarList(invites.items, "number", 10, "Days pending")`;

const AI_AND_CREDITS = `root = Dashboard([header, section])
header = DashboardHeader("AI adoption and credits", "Who uses AI, how much, and whether the credits last")
$workspace = "brightline"
$window = "28d"
section = Section([kpiRow, creditRow, bandRow], filters)
filters = FilterBar([workspaceFilter, windowFilter])
${WORKSPACE_FILTER}
${WINDOW_FILTER}
ai = Query("get_ai_adoption", {workspace: $workspace, window: $window}, {metrics: [], weeks: [], power: [], habitual: [], occasional: [], features: [], aiOff: []})
credits = Query("get_credits", {workspace: $workspace}, {pool: {}, byTeam: [], metrics: [], atLimit: []})
kpiRow = CardRow([kpiCard])
kpiCard = LargeCard([kpiStrip])
kpiStrip = KpiStrip(ai.metrics)
creditRow = CardRow([creditCard, teamCard])
creditCard = LargeCard([creditHeader, creditBurn])
creditHeader = DashboardCardHeader("Credit pool", "Used against the allowance, with alerts at 75%, 90%, and 100%")
creditBurn = CreditBurn(credits.pool)
teamCard = MediumCard([teamHeader, teamList])
teamHeader = DashboardCardHeader("Credits by team", "This period so far")
teamList = BarList(credits.byTeam, "number", 8)
bandRow = CardRow([bandCard, featureCard])
bandCard = LargeCard([bandHeader, bandChart])
bandHeader = DashboardCardHeader("AI users by intensity", "Members by AI actions each week: power 15+, habitual 3–14, occasional 1–2")
bandChart = ColumnChart(ai.weeks, [{name: "Power", values: ai.power}, {name: "Habitual", values: ai.habitual}, {name: "Occasional", values: ai.occasional}], "number", true)
featureCard = MediumCard([featureHeader, featureList])
featureHeader = DashboardCardHeader("AI actions by feature", "In the window")
featureList = BarList(ai.features, "number", 4)`;

const TEAMS_AND_MEMBERS = `root = Dashboard([header, section])
header = DashboardHeader("Teams and members", "Who uses Relay, and how")
$workspace = "brightline"
$window = "28d"
$status = "all"
$team = "all"
$names = "show"
section = Section([teamRow, collabRow, memberRow], filters)
filters = FilterBar([workspaceFilter, windowFilter, statusFilter, nameFilter])
${WORKSPACE_FILTER}
${WINDOW_FILTER}
statusFilter = FilterSelect("status", "Status", [{value: "all", label: "All members"}, {value: "active", label: "Active"}, {value: "inactive", label: "Inactive"}, {value: "dormant", label: "Dormant"}, {value: "never_active", label: "Never active"}], $status)
nameFilter = FilterSelect("names", "Names", [{value: "show", label: "Show names"}, {value: "hide", label: "Hide names"}], $names)
teams = Query("get_team_adoption", {workspace: $workspace, window: $window}, {rows: [], note: ""})
features = Query("get_feature_adoption", {workspace: $workspace, window: $window}, {items: [], metrics: []})
teamRow = CardRow([teamCard, featureCard])
teamCard = LargeCard([teamHeader, teamTable])
teamHeader = DashboardCardHeader("Adoption by team", teams.note)
teamTable = TeamAdoption(teams.rows)
featureCard = MediumCard([featureHeader, featureStrip, featureList])
featureHeader = DashboardCardHeader("What members use", "Share of active members who used each part in the window")
featureStrip = KpiStrip(features.metrics)
featureList = BarList(features.items, "percent", 5)
collab = Query("get_collaboration", {workspace: $workspace, window: $window}, {metrics: [], pairs: [], byTeam: [], note: ""})
collabRow = CardRow([collabCard, crossCard])
collabCard = LargeCard([collabHeader, collabStrip, pairList])
collabHeader = DashboardCardHeader("Working together", collab.note)
collabStrip = KpiStrip(collab.metrics)
pairList = BarList(collab.pairs, "number", 8, "Items both teams worked on")
crossCard = MediumCard([crossHeader, crossList])
crossHeader = DashboardCardHeader("Work shared with other teams", "Share of each team's items that other teams also worked on")
crossList = BarList(collab.byTeam, "percent", 10)
members = Query("get_members", {workspace: $workspace, status: $status, team: $team, names: $names, limit: 500}, ${MEMBERS_DEFAULTS})
memberRow = CardRow([memberCard])
memberCard = LargeCard([memberHeader, memberTable])
memberHeader = DashboardCardHeader("Members", "Sort any column, search, or export; activity counts the last 28 days")
memberTable = MemberTable(members.rows)`;

const VALUE_REPORT = `root = Dashboard([header, section])
header = DashboardHeader("Value report", "What Relay's AI saves, and how the workspace compares")
$workspace = "brightline"
$window = "90d"
$minutes = "6"
$rate = "72"
$by = "contribution"
$names = "hide"
section = Section([valueRow, contentRow, championRow], filters)
filters = FilterBar([workspaceFilter, windowFilter, minutesFilter, rateFilter, byFilter, nameFilter])
byFilter = FilterSelect("by", "Champions by", [{value: "contribution", label: "Contribution"}, {value: "helping", label: "Helping other teams"}], $by)
nameFilter = FilterSelect("names", "Names", [{value: "hide", label: "Hide names"}, {value: "show", label: "Show names"}], $names)
${WORKSPACE_FILTER}
${WINDOW_FILTER}
minutesFilter = FilterSelect("minutes", "Minutes per AI action", [{value: "3", label: "3 minutes"}, {value: "6", label: "6 minutes"}, {value: "10", label: "10 minutes"}], $minutes)
rateFilter = FilterSelect("rate", "Hourly rate", [{value: "50", label: "$50"}, {value: "72", label: "$72"}, {value: "100", label: "$100"}], $rate)
value = Query("get_value_estimate", {workspace: $workspace, window: $window, minutes: $minutes, rate: $rate}, {hours: 0, value: 0, lines: [], minutes: 6, rate: 72, perMember: 0, formula: "", caveat: ""})
peers = Query("get_peer_benchmarks", {workspace: $workspace}, {rows: [], pool: ""})
valueRow = CardRow([valueCard, peerCard])
valueCard = LargeCard([valueHeader, valueEstimate])
valueHeader = DashboardCardHeader("Estimated time saved", "AI actions in the window × minutes per action × hourly rate")
valueEstimate = ValueEstimate(value)
peerCard = MediumCard([peerHeader, peerBars])
peerHeader = DashboardCardHeader("Against similar workspaces", "Where this workspace sits among Relay workspaces of its size")
peerBars = PeerBenchmark(peers.rows, peers.pool)
features = Query("get_feature_adoption", {workspace: $workspace, window: $window}, {items: [], metrics: []})
contentRow = CardRow([contentCard])
contentCard = LargeCard([contentHeader, contentStrip, contentList])
contentHeader = DashboardCardHeader("Work done in Relay", "Items created and tasks completed, and what members use")
contentStrip = KpiStrip(features.metrics)
contentList = BarList(features.items, "percent", 5)
champions = Query("get_champions", {workspace: $workspace, window: $window, by: $by, names: $names}, {rows: [], note: ""})
championRow = CardRow([championCard])
championCard = LargeCard([championHeader, championList])
championHeader = DashboardCardHeader("Champions", "The ten members doing the most; members can opt out")
championList = ChampionList(champions.rows, champions.note)`;

const SECURITY_AND_ACCESS = `root = Dashboard([header, section])
header = DashboardHeader("Security and access", "How members sign in, who outside the workspace has access, and what admins changed")
$workspace = "brightline"
section = Section([postureRow], filters)
filters = FilterBar([workspaceFilter])
${WORKSPACE_FILTER}
security = Query("get_security", {workspace: $workspace}, {coverage: [], metrics: [], events: []})
postureRow = CardRow([postureCard, auditCard])
postureCard = LargeCard([postureHeader, postureStrip, posture])
postureHeader = DashboardCardHeader("Coverage", "Sign-in, provisioning, and guests")
postureStrip = KpiStrip(security.metrics)
posture = SecurityPosture(security.coverage)
auditCard = MediumCard([auditHeader, audit])
auditHeader = DashboardCardHeader("Admin events", "The last 30 days, newest first")
audit = AuditLog(security.events)`;

const SMALL_TEAM = `root = Dashboard([header, section])
header = DashboardHeader("Small team", overview.workspaceLabel)
$workspace = "bluefin"
$window = "28d"
$metric = ""
section = Section([heroRow, memberRow])
overview = Query("get_workspace_overview", {workspace: $workspace, window: $window}, ${OVERVIEW_DEFAULTS})
credits = Query("get_credits", {workspace: $workspace}, {pool: {}, byTeam: [], metrics: [], atLimit: []})
heroRow = CardRow([heroCard, creditCard])
heroCard = LargeCard([hero])
hero = HeroMetric(overview.hero, overview.heroTrend, overview.metrics, $metric)
creditCard = MediumCard([creditHeader, creditBurn])
creditHeader = DashboardCardHeader("AI credits this month", "The team's pool")
creditBurn = CreditBurn(credits.pool)
members = Query("get_members", {workspace: $workspace, limit: 50}, ${MEMBERS_DEFAULTS})
memberRow = CardRow([memberCard])
memberCard = LargeCard([memberHeader, memberTable])
memberHeader = DashboardCardHeader("Everyone on the team", "Small teams see members, not team breakdowns")
memberTable = MemberTable(members.rows)`;

export const usageKit: KitDefinition = {
  id: "usage",
  name: "Workspace usage",
  tagline:
    "The usage page a SaaS shows its customers' admins: seats and reclaim, active members, adoption by team, AI adoption and credits, estimated value, benchmarks, and security.",
  preamble:
    "You build workspace usage dashboards for the admins of a Relay workspace (Relay is a team workspace app with boards, tasks, docs, and AI features, sold per seat with AI credits). The admin manages their own workspace's seats, members, AI, and security. You are generating an openui-lang dashboard.",
  rules: [
    'Filters: $workspace ("brightline" | "kestrel" | "bluefin"), $window ("7d" | "28d" | "90d", default "28d"). Tool arguments of the same names take these values. get_seat_inventory, get_invites, get_credits, get_peer_benchmarks, get_security, and get_admin_actions take no window. Only add filters the dashboard\'s tools accept.',
    `Definitions: ${glossary()}. Inactive after 30 days without activity, dormant after 90. Each KPI carries its definition.`,
    "Privacy: team views hide teams under 5 members; never show one member's AI use in a team breakdown. Hours saved and value are estimates: always show ValueEstimate with its formula, never the figure alone.",
    "Match questions to tools: overview → get_workspace_overview, get_usage_insights, get_activity; seats, renewal, idle → get_seat_inventory, get_members view reclaim, get_admin_actions; invites → get_invites; teams → get_team_adoption, get_feature_adoption, get_collaboration; top contributors → get_champions; members → get_members; AI → get_ai_adoption, get_credits; value → get_value_estimate, get_peer_benchmarks; security → get_security.",
    'Give every card except the hero a DashboardCardHeader whose subtitle says what is measured. Query defaults for get_workspace_overview: {periodLabel: "", workspaceLabel: "", hero: {label: "Loading", value: "—"}, heroTrend: {labels: [], current: []}, metrics: [], rules: []}.',
  ],
  tools: usageTools,
  gallery: [
    {
      title: "Workspace overview",
      description:
        "Seat utilization hero beside what needs attention, usage KPIs with how members were counted, active members over the window, where every seat is, and adoption by team.",
      program: WORKSPACE_OVERVIEW,
    },
    {
      title: "Seats and renewal",
      description:
        "Every paid seat by state with the forecast at renewal, the admin's next actions, the seats to reclaim with remind and reclaim, and pending invites.",
      program: SEATS_AND_RENEWAL,
    },
    {
      title: "AI adoption and credits",
      description:
        "AI adoption KPIs, the credit pool against its pace with alerts, credits by team, AI users by intensity week by week, and AI actions by feature.",
      program: AI_AND_CREDITS,
    },
    {
      title: "Teams and members",
      description:
        "Adoption by team with the privacy rule, what members use, how teams work together, and the full member directory with filters, search, sorting, CSV export, and a names toggle.",
      program: TEAMS_AND_MEMBERS,
      example: false,
    },
    {
      title: "Value report",
      description:
        "Estimated hours saved and their value with editable minutes and rate, the workspace against similar ones, the work done in Relay, and the champions (names hidden by default).",
      program: VALUE_REPORT,
      example: false,
    },
    {
      title: "Security and access",
      description:
        "Sign-in method, provisioning, and guest coverage with the gaps named, and recent admin events.",
      program: SECURITY_AND_ACCESS,
      example: false,
    },
    {
      title: "Small team",
      description:
        "A 22-seat workspace: the overview hero, its monthly AI credits, and everyone on the team, without team breakdowns.",
      program: SMALL_TEAM,
      example: false,
    },
  ],
  starters: [
    "Are we using the seats we pay for, and which can we reclaim before renewal?",
    "How is AI catching on across our teams, and will our credits last?",
    "What has Relay saved us, and how do we compare with similar companies?",
    "Who signs in without SSO, and what did admins change recently?",
  ],
};
