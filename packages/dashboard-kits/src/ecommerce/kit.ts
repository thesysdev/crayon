import type { KitDefinition } from "../core/kit";
import { ecommerceTools } from "./tools";

const RANGE_FILTER = `rangeFilter = FilterSelect("range", "Period", [{value: "7d", label: "Last 7 days"}, {value: "30d", label: "Last 30 days"}, {value: "90d", label: "Last 90 days"}], $range)`;
const KPI_DEFAULTS = `{periodLabel: "", hero: {label: "Loading", value: "—"}, heroTrend: {labels: [], current: []}, metrics: []}`;
const ITEMS_DEFAULTS = `{labels: [], totalSales: [], orders: [], items: [], overTime: {labels: [], series: []}}`;

const STORE_OVERVIEW = `root = Dashboard([header, section])
header = DashboardHeader("Store overview", kpis.periodLabel)
$range = "30d"
$channel = "all"
section = Section([heroRow, kpiRow, flowRow, mixRow], filters)
filters = FilterBar([rangeFilter, channelFilter])
${RANGE_FILTER}
channelFilter = FilterSelect("channel", "Sales channel", [{value: "all", label: "All channels"}, {value: "online", label: "Online store"}, {value: "app", label: "Mobile app"}, {value: "amazon", label: "Amazon"}], $channel)
kpis = Query("get_store_kpis", {range: $range, channel: $channel}, ${KPI_DEFAULTS})
insights = Query("get_store_insights", {range: $range, channel: $channel}, {insights: []})
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
breakdown = Query("get_sales_breakdown", {range: $range, channel: $channel}, {lines: []})
journey = Query("get_purchase_journey", {range: $range}, {steps: [], conversionRate: "—"})
top = Query("get_product_performance", {range: $range, channel: $channel, limit: 5}, {products: []})
goal = Query("get_sales_goal", {channel: $channel}, {label: "", goal: 0, labels: [], cumulative: []})
flowRow = CardRow([breakdownCard, journeyCard, goalCard])
breakdownCard = MediumCard([breakdownHeader, breakdownChart])
breakdownHeader = DashboardCardHeader("Total sales breakdown", "From gross sales to what the store collected")
breakdownChart = MoneyBreakdown(breakdown.lines)
journeyCard = MediumCard([journeyHeader, journeyFunnel])
journeyHeader = DashboardCardHeader(journey.conversionRate, "Session to purchase, store and app", "number")
journeyFunnel = ConversionFunnel(journey.steps)
goalCard = MediumCard([goalHeader, goalPace])
goalHeader = DashboardCardHeader("Monthly goal", "October sales against the pace needed to reach the goal")
goalPace = GoalPace(goal)
byChannel = Query("get_sales_by", {range: $range, channel: $channel, dimension: "channel"}, ${ITEMS_DEFAULTS})
byCountry = Query("get_sales_by", {range: $range, channel: $channel, dimension: "country"}, ${ITEMS_DEFAULTS})
mixRow = CardRow([topCard, whereCard])
topCard = MediumCard([topHeader, leaderboard])
topHeader = DashboardCardHeader("Top products", "By revenue, with change")
leaderboard = ProductLeaderboard(top.products, 5)
whereCard = LargeCard([whereHeader, channelShare, countryList])
whereHeader = DashboardCardHeader("Where sales come from", "By channel, then by country; select a channel to filter the dashboard")
channelShare = ShareBar(byChannel.items, "currency", $channel)
countryList = BarList(byCountry.items, "currency", 6, "By country")`;

const MARKETING_AND_PROFIT = `root = Dashboard([header, section])
header = DashboardHeader("Marketing and profit", mkt.periodLabel)
$range = "30d"
section = Section([heroRow, kpiRow, channelRow, mixRow], filters)
filters = FilterBar([rangeFilter])
${RANGE_FILTER}
mkt = Query("get_marketing_performance", {range: $range}, {periodLabel: "", hero: {label: "Blended ROAS", value: "—"}, heroTrend: {labels: [], current: []}, metrics: [], channels: [], targetRoas: 2})
profit = Query("get_profit_breakdown", {range: $range}, {lines: [], grossMargin: "—", contributionMargin: "—"})
heroRow = CardRow([heroCard, profitCard])
heroCard = LargeCard([hero])
$metric = ""
hero = HeroMetric(mkt.hero, mkt.heroTrend, mkt.metrics, $metric)
profitCard = MediumCard([profitHeader, profitChart])
profitHeader = DashboardCardHeader(profit.contributionMargin, "Contribution margin after marketing", "number")
profitChart = MoneyBreakdown(profit.lines)
kpiRow = CardRow([kpiCard])
kpiCard = LargeCard([kpiStrip])
kpiStrip = KpiStrip(mkt.metrics, $metric)
channelRow = CardRow([channelCard])
channelCard = LargeCard([channelHeader, channelTable])
channelHeader = DashboardCardHeader("Channel performance", "Attributed revenue and ROAS against the target, by channel")
channelTable = ChannelPerformance(mkt.channels, mkt.targetRoas)
mix = Query("get_new_vs_returning", {range: $range}, {labels: [], newCustomerSales: [], returningCustomerSales: [], newCustomers: [], returningCustomers: []})
byCountry = Query("get_sales_by", {range: $range, dimension: "country"}, ${ITEMS_DEFAULTS})
mixRow = CardRow([mixCard, countryCard])
mixCard = LargeCard([mixHeader, mixChart])
mixHeader = DashboardCardHeader("Sales from new and returning customers", "Where acquisition spend shows up in revenue")
mixChart = ColumnChart(mix.labels, [{name: "New customers", values: mix.newCustomerSales}, {name: "Returning customers", values: mix.returningCustomerSales}], "currency", true, "Sales (USD)")
countryCard = MediumCard([countryHeader, countryList])
countryHeader = DashboardCardHeader("Where customers are", "Total sales by country, with change")
countryList = BarList(byCountry.items, "currency")`;

const CUSTOMERS_AND_RETENTION = `root = Dashboard([header, section])
header = DashboardHeader("Customers and retention", customers.periodLabel)
$range = "30d"
$cohortMetric = "ltv"
section = Section([heroRow, kpiRow, cohortRow, segmentRow, mixRow], filters)
filters = FilterBar([rangeFilter, cohortFilter])
${RANGE_FILTER}
cohortFilter = FilterSelect("cohortMetric", "Cohort view", [{value: "ltv", label: "Cumulative LTV"}, {value: "repeat_rate", label: "Repeat purchase rate"}], $cohortMetric)
customers = Query("get_customer_kpis", {range: $range}, ${KPI_DEFAULTS})
orderJourney = Query("get_order_journey", {}, {steps: []})
heroRow = CardRow([heroCard, journeyCard])
heroCard = LargeCard([hero])
$metric = ""
hero = HeroMetric(customers.hero, customers.heroTrend, customers.metrics, $metric)
journeyCard = MediumCard([journeyHeader, journeyFunnel])
journeyHeader = DashboardCardHeader("From first to fifth order", "Last 12 months against the prior 12")
journeyFunnel = ConversionFunnel(orderJourney.steps)
kpiRow = CardRow([kpiCard])
kpiCard = LargeCard([kpiStrip])
kpiStrip = KpiStrip(customers.metrics, $metric)
cohorts = Query("get_customer_cohorts", {metric: $cohortMetric, months: 9}, {periodLabels: [], cohorts: [], format: "currency"})
cohortRow = CardRow([cohortCard])
cohortCard = LargeCard([cohortHeader, cohortGrid])
cohortHeader = DashboardCardHeader("Monthly cohorts by first order", "Read down a column to compare cohorts at the same age")
cohortGrid = CohortGrid(cohorts.cohorts, cohorts.periodLabels, cohorts.format, "Customers")
segments = Query("get_customer_segments", {}, {totalCustomers: 0, segments: []})
segmentRow = CardRow([segmentCard])
segmentCard = LargeCard([segmentHeader, segmentTiles])
segmentHeader = DashboardCardHeader("RFM segments", "Last 12 months of customers by recency, frequency, and spend")
segmentTiles = CustomerSegments(segments.segments)
mix = Query("get_new_vs_returning", {range: $range}, {labels: [], newCustomerSales: [], returningCustomerSales: [], newCustomers: [], returningCustomers: []})
mixRow = CardRow([mixCard])
mixCard = LargeCard([mixHeader, mixChart])
mixHeader = DashboardCardHeader("New and returning customers", "Customers placing an order in each period")
mixChart = ColumnChart(mix.labels, [{name: "New", values: mix.newCustomers}, {name: "Returning", values: mix.returningCustomers}], "number", true, "Customers")`;

const MERCHANDISING_AND_CHECKOUT = `root = Dashboard([header, section])
header = DashboardHeader("Merchandising and checkout", "Products, stock, and where shoppers drop off")
$range = "30d"
$category = "all"
$device = "all"
section = Section([productRow, stockRow, journeyRow, slaRow, ordersRow], filters)
filters = FilterBar([rangeFilter, categoryFilter, deviceFilter])
${RANGE_FILTER}
categoryFilter = FilterSelect("category", "Category", [{value: "all", label: "All categories"}, {value: "apparel", label: "Apparel"}, {value: "footwear", label: "Footwear"}, {value: "accessories", label: "Accessories"}, {value: "home", label: "Home"}], $category)
deviceFilter = FilterSelect("device", "Device", [{value: "all", label: "All devices"}, {value: "desktop", label: "Desktop"}, {value: "mobile", label: "Mobile"}, {value: "tablet", label: "Tablet"}], $device)
products = Query("get_product_performance", {range: $range, category: $category, limit: 8}, {products: []})
productRow = CardRow([productCard])
productCard = LargeCard([productHeader, productTable])
productHeader = DashboardCardHeader("Product performance", "Revenue, page conversion, returns, margin, and stock")
productTable = ProductPerformance(products.products)
stock = Query("get_inventory_health", {category: $category}, {metrics: [], items: []})
byCategory = Query("get_sales_by", {range: $range, dimension: "category"}, ${ITEMS_DEFAULTS})
stockRow = CardRow([stockCard, alertsCard])
stockCard = LargeCard([stockHeader, stockStrip, categoryChart])
stockHeader = DashboardCardHeader("Inventory and category sales", "Stock position today, and daily sales by category for the period")
stockStrip = KpiStrip(stock.metrics)
categoryChart = ColumnChart(byCategory.overTime.labels, byCategory.overTime.series, "currency", true, "Sales (USD)")
alertsCard = MediumCard([alertsHeader, alerts])
alertsHeader = DashboardCardHeader("Restock now", "Below reorder point, with open purchase orders")
alerts = InventoryAlerts(stock.items)
journey = Query("get_purchase_journey", {range: $range, device: $device}, {steps: [], conversionRate: "—"})
checkout = Query("get_checkout_journey", {range: $range, device: $device}, {steps: [], checkoutCompletion: "—"})
byDevice = Query("get_sales_by", {range: $range, dimension: "device"}, ${ITEMS_DEFAULTS})
journeyRow = CardRow([journeyCard, checkoutCard, deviceCard])
journeyCard = MediumCard([journeyHeader, journeyFunnel])
journeyHeader = DashboardCardHeader(journey.conversionRate, "Purchase journey, session to purchase", "number")
journeyFunnel = ConversionFunnel(journey.steps)
checkoutCard = MediumCard([checkoutHeader, checkoutFunnel])
checkoutHeader = DashboardCardHeader(checkout.checkoutCompletion, "Checkout journey completion", "number")
checkoutFunnel = ConversionFunnel(checkout.steps)
deviceCard = MediumCard([deviceHeader, deviceShare])
deviceHeader = DashboardCardHeader("Sales by device", "Store and app")
deviceShare = ShareBar(byDevice.items, "currency", $device)
recent = Query("get_recent_orders", {limit: 8}, {orders: []})
sla = Query("get_fulfillment_sla", {range: $range}, {days: [], summary: ""})
slaRow = CardRow([slaCard])
slaCard = LargeCard([slaHeader, slaTracker])
slaHeader = DashboardCardHeader("Fulfillment", "Orders shipped within 48 hours, each day against the 95% target")
slaTracker = Tracker(sla.days, sla.summary)
ordersRow = CardRow([ordersCard])
ordersCard = LargeCard([ordersHeader, ordersTable])
ordersHeader = DashboardCardHeader("Latest orders", "Newest first, all channels")
ordersTable = Table([Col("Order", recent.orders.id), Col("Customer", recent.orders.customer), Col("Channel", recent.orders.channel), Col("Items", recent.orders.items, "number"), Col("Total", recent.orders.total, "number"), Col("Fulfillment", recent.orders.fulfillment), Col("Country", recent.orders.country), Col("Placed", recent.orders.placedAt)])`;

export const ecommerceKit: KitDefinition = {
  id: "ecommerce",
  name: "E-commerce",
  tagline:
    "Sales, marketing efficiency, profit, customers and cohorts, merchandising, and checkout for a direct-to-consumer brand.",
  preamble:
    "You build e-commerce analytics dashboards for the team running Sundial Goods, a direct-to-consumer brand selling apparel, footwear, accessories, and home goods through its online store, mobile app, and Amazon. You are generating an openui-lang dashboard.",
  rules: [
    'Filters: $range ("7d" | "30d" | "90d", default "30d"), $channel ("all" | "online" | "app" | "amazon"), $category ("all" | "apparel" | "footwear" | "accessories" | "home"), $device ("all" | "desktop" | "mobile" | "tablet"). Only add filters that the dashboard\'s tools accept.',
    "Definitions: total sales = net sales + shipping + taxes; net sales = gross sales − discounts − returns; blended ROAS = store and app revenue ÷ ad spend; MER = total sales ÷ all marketing spend; new customer CPA = ad spend ÷ new-customer orders; returning customer rate = share of orders from returning customers.",
    'Layout: open with a hero row, CardRow([LargeCard([HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric)]), MediumCard([...])]), where the MediumCard holds what explains the hero (InsightList with a limit, a funnel, or a MoneyBreakdown). Then a LargeCard row with KpiStrip(kpis.metrics, $metric). Declare $metric = "" so selecting a KPI tile shows that metric in the hero chart. Then breakdowns in rows of three MediumCards or a LargeCard and a MediumCard.',
    'Use a KPI tool\'s periodLabel as the DashboardHeader subtitle: DashboardHeader("Store overview", kpis.periodLabel). KPI query defaults: {periodLabel: "", hero: {label: "Loading", value: "—"}, heroTrend: {labels: [], current: []}, metrics: []}.',
    'Charts: TrendChart over time (mark the prior period "muted"), ColumnChart for per-period counts or stacked new versus returning, BarList for ranked categories (countries, categories, channels), ShareBar for part-to-whole (channel or device mix). Do not use LineChart, AreaChart, BarChart, or PieChart.',
    "Match questions to tools: overview → get_store_kpis, get_store_insights, get_sales_breakdown, get_sales_by; ad spend and ROAS → get_marketing_performance; profit → get_profit_breakdown; customer value and retention → get_customer_kpis, get_customer_cohorts, get_customer_segments, get_order_journey; products and stock → get_product_performance, get_inventory_health; conversion → get_purchase_journey, get_checkout_journey.",
    'Give every card except the hero a DashboardCardHeader whose subtitle says what is measured and against what, e.g. "Attributed revenue and ROAS against the target, by channel". When a card leads with one number, make it the title with titleType "number".',
  ],
  tools: ecommerceTools,
  gallery: [
    {
      title: "Store overview",
      description:
        "Total sales hero with the prior period and the Fall sale, what changed, supporting KPIs, the sales waterfall, the purchase funnel, channel mix, top products, countries, and categories.",
      program: STORE_OVERVIEW,
    },
    {
      title: "Marketing and profit",
      description:
        "Blended ROAS hero beside the contribution profit waterfall, marketing KPIs, channel ROAS against target with revenue sparklines, new versus returning sales, and sales by country.",
      program: MARKETING_AND_PROFIT,
    },
    {
      title: "Customers and retention",
      description:
        "New customers hero beside the 1st-to-5th order funnel, customer KPIs, first-order cohorts (LTV or repeat rate), RFM segments with actions, and new versus returning customers.",
      program: CUSTOMERS_AND_RETENTION,
    },
    {
      title: "Merchandising and checkout",
      description:
        "Product table with sparklines, returns, margin, and stock; inventory position and restock alerts; purchase and checkout funnels by device; device mix; latest orders.",
      program: MERCHANDISING_AND_CHECKOUT,
    },
  ],
  starters: [
    "Give me this month's store overview: what changed and why?",
    "Is our ad spend paying back? Compare channels against the ROAS target and show contribution profit.",
    "How valuable are the customers we acquired this year, and who is about to churn?",
    "Which products need restocking, and where do mobile shoppers drop off in checkout?",
  ],
};
