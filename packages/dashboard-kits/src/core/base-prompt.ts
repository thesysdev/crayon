import type { ComponentGroup } from "@openuidev/react-lang";

// The published @openuidev/thesys 0.14.0 dashboardLibrary ships without its
// component groups, so its prompt lists signatures but none of the layout
// rules. These groups and rules restore them for every kit. They are adapted
// from genui-sdk `packages/c1/src/dashboard/library.ts` and
// `scripts/dashboardPromptOptions.ts` (genui-sdk main 398582da) to the 0.14.0
// signatures: trends are `{direction, value}` objects and filter options are
// `{value, label}` objects. Drop this file once the base library carries them.

export const BASE_COMPONENT_GROUPS: ComponentGroup[] = [
  {
    name: "Dashboard Layout",
    components: [
      "Dashboard",
      "DashboardHeader",
      "Section",
      "FilterBar",
      "FilterSelect",
      "FilterMultiSelect",
      "DatePicker",
      "CardRow",
      "IconButton",
    ],
    notes: [
      "Use Dashboard as the dashboard root with DashboardHeader plus Section children.",
      "Use one Section for most dashboard content. Create multiple Sections only for altogether different topics or domains. Do not create a new Section for every row or card.",
      "A Section owns rows and an optional section-scoped FilterBar. Put a FilterBar in the Section whose rows it affects.",
      "FilterBar supports only FilterSelect, FilterMultiSelect, and DatePicker. Do not put Select, TextContent, or TagBlock inside FilterBar.",
      "Valid CardRow patterns are: small-only, medium-only, medium+large mixed, or large-only.",
    ],
  },
  {
    name: "Shell Cards",
    components: [
      "SmallCard",
      "MediumCard",
      "LargeCard",
      "DashboardCardHeader",
      "TextBlock",
      "List",
      "ListItem",
      "EntityList",
      "Callout",
      "Button",
      "ButtonGroup",
      "Select",
      "SelectItem",
      "ImageBlock",
      "Tag",
      "TagBlock",
      "TextContent",
      "MarkDownRenderer",
      "TextCallout",
    ],
    notes: [
      "SmallCard is compact. MediumCard supports DashboardCardHeader, text, callouts, charts, tables, lists, actions, tags, and metrics. LargeCard supports the same content as MediumCard except PieChart, RadialChart, RadarChart, List, and EntityList.",
      'Use DashboardCardHeader as the first child inside MediumCard or LargeCard. If a card has a clear leading KPI, make that value the DashboardCardHeader title with titleType "number" and use the subtitle for the label.',
      "Do not use PieChart, RadialChart, or RadarChart inside LargeCard.",
      "Inside LargeCard, use vertical BarChart for categorical comparisons.",
      "Use MediumCard(children, true) only for dense cards with multiple body blocks or large tables.",
      "SmallCard has three forms: SmallCard(title, metric, trend?) for KPIs; SmallCard(IconText(Icon(name), variant), [MetricIndicator(value, label, trend?)]) for a KPI with a universal symbol; SmallCard(lhs, rhs) for compact entity rows.",
    ],
  },
  {
    name: "Metrics",
    components: ["MetricIndicator", "OverviewCardItem", "OverviewCardBlock"],
    notes: [
      "Use MetricIndicator for concise value plus trend callouts inside cards.",
      "Use OverviewCardBlock for KPI grids with OverviewCardItem children.",
    ],
  },
  {
    name: "Charts",
    components: [
      "LineChart",
      "BarChart",
      "AreaChart",
      "HorizontalBarChart",
      "RadarChart",
      "ScatterChart",
      "RadialChart",
      "PieChart",
      "Series",
      "ScatterSeries",
      "Point",
    ],
    notes: [
      "Use LineChart for trends over time, AreaChart for volume over time, and BarChart for comparing categories.",
      "Use PieChart for part-to-whole breakdowns with a handful of slices.",
      "Use HorizontalBarChart only when category labels are long.",
    ],
  },
  {
    name: "Data Display",
    components: ["Table", "Col"],
    notes: [
      "Use Table with Col children for tabular data. Tables auto-paginate at 10 rows.",
      'Set Col type to "number" for right-aligned numeric columns.',
    ],
  },
  {
    name: "Primitives",
    components: ["Icon", "IconText", "IconTag"],
    notes: ['Icon takes a lucide icon name such as "dollar-sign" or "users".'],
  },
];

export const BASE_RULES: string[] = [
  "Output MUST begin with `root = Dashboard([children])` on the first line.",
  "Arguments are POSITIONAL — do NOT use named args with colons.",
  "Dashboard children must be DashboardHeader and Section components.",
  "Each Section contains an array of CardRow components and an optional FilterBar.",
  "CardRow contains SmallCard, MediumCard, or LargeCard — do not mix SmallCard with MediumCard or LargeCard in the same row.",
  'Trends are objects: {direction: "up" | "down", value: number}.',
  'FilterSelect options are objects: [{value: "30d", label: "Last 30 days"}].',
  'Icon takes a lucide icon name string such as "dollar-sign" or "users".',
];

/** Rules every kit shares: dashboards read live data through the kit's tools. */
export const DATA_RULES: string[] = [
  "Every number on the dashboard must come from a Query of the listed tools. Never type sample numbers, labels, or rows into the program.",
  'Query defaults must match the tool\'s output shape, e.g. {labels: [], totalSales: []} or {periodLabel: "", metrics: []}.',
  "Tool outputs are shaped for the component that shows them: pass the field straight through, e.g. KpiStrip(kpis.metrics), ConversionFunnel(funnel.steps), CohortGrid(c.cohorts, c.periodLabels, c.format). The tool descriptions name the component each one feeds.",
  'Pluck table columns from an object array: Col("Name", result.rows.name).',
  "Declare each filter as a $variable with a default, bind it as the FilterSelect's defaultValue, and pass it to every Query that accepts that argument.",
];
