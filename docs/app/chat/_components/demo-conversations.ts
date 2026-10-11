import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import type { Artifact, Message, UserMessage } from "@openuidev/react-headless";
import { STOCK_REPORT_PROGRAM } from "./stock-report-program";

export type DemoConversationIcon = "analytics" | "travel" | "compare";
export type DemoArtifactKind = "report" | "slides";

export interface DemoArtifact extends Artifact {
  id: `demo_artifact_${string}`;
  type: DemoArtifactKind;
  content: string;
  program: string;
}

export interface DemoConversation {
  id: `demo_${string}`;
  slug: string;
  title: string;
  description: string;
  icon: DemoConversationIcon;
  sourcePrompt: string;
  recordedModel: string;
  linkedArtifactId?: DemoArtifact["id"];
  messages: Message[];
}

const DEMO_IMAGES = {
  ai: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=82",
  cinema:
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=82",
  cinemaAudience:
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=82",
  cinemaProjector:
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1600&q=82",
  coffee:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=82",
  coffeeBeans:
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=82",
  collaboration:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=82",
  dashboard:
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=82",
  japan:
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=82",
  japanLandscape:
    "https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=1600&q=82",
  japanStreet:
    "https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?auto=format&fit=crop&w=1600&q=82",
  office:
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=82",
  planning:
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=82",
  posterAvatar: "https://image.tmdb.org/t/p/w1280/kyeqWdyUXW608qlYkRqosgbbJyK.jpg",
  posterEndgame: "https://image.tmdb.org/t/p/w1280/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
  posterWayOfWater: "https://image.tmdb.org/t/p/w1280/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
  stadium:
    "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=82",
  stock:
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=82",
  technology:
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=82",
} as const;

const TRAVEL_DECK_PROGRAM = `root = SlideShow("Must-See Japan", "A first-timer's highlight tour", [cover, contrast, cities, route, rhythm, closing])
cover = Slide("cover", DramaticTitle("Must-See Japan", "Cities, temples, mountains, and food", "An eight-day first-timer's route", null, "title-bottom", "${DEMO_IMAGES.japanLandscape}"))
contrast = Slide("contrast", ContentWithImage("Old meets new", ["${DEMO_IMAGES.japan}", "${DEMO_IMAGES.japanStreet}"], "Move from neon districts to quiet shrines in a single afternoon, then connect the trip by fast, reliable rail.", "image-center"))
cities = Slide("cities", VisualCards("Three essential bases", [{title: "Tokyo", body: "Energy, design, food, and late-night neighborhoods.", imageSrc: "${DEMO_IMAGES.japanStreet}"}, {title: "Kyoto", body: "Temples, gardens, craft, and early-morning calm.", imageSrc: "${DEMO_IMAGES.japan}"}, {title: "Osaka", body: "A relaxed base for street food and Kansai day trips.", imageSrc: "${DEMO_IMAGES.japanLandscape}"}]))
route = Slide("route", ChartWithContext("Eight-day route", BarChartV2({data: {labels: ["Tokyo", "Hakone", "Kyoto", "Osaka"], series: [{category: "Nights", values: [3, 1, 3, 1]}]}}, "City", "Nights"), "Keep transfers light and give Kyoto enough unhurried mornings.", "title-body-top"))
rhythm = Slide("rhythm", MetricsWithImage("A trip with room to breathe", [{metric: "8 days", description: "Enough for four bases"}, {metric: "3 cities", description: "The cultural spine"}, {metric: "1 bag", description: "Use luggage forwarding"}], ["${DEMO_IMAGES.japan}", "${DEMO_IMAGES.japanLandscape}"]))
closing = Slide("closing", HeroMetric("Tokyo → Osaka", "Fly into Tokyo, out of Osaka, and let the route unfold in one direction.", "vertical", "${DEMO_IMAGES.japanStreet}"))`;

const BLOCKBUSTER_DECK_PROGRAM = `root = SlideShow("Blockbuster Box Office", "The Economics of Event Cinema", slides)
slides = [slide1, slide2, slide3, slide4, slide5, slide6, slide7]

slide1 = Slide("slide-1", content1)
content1 = DramaticTitle("Blockbuster Box Office", "What the three highest-grossing films reveal about event cinema", "WORLDWIDE BOX OFFICE · $8.06B across three films", null, "title-center", "https://cdn.celluloidjunkie.com/wp-content/uploads/2025/12/10015609/UAE-Vox-Mall-of-Emirates-IMAX-Oma-Cinema-Ferco-Seating.jpg")

slide2 = Slide("slide-2", content2)
content2 = VisualCards("Meet the All-Time Podium", cards2)
cards2 = [card2a, card2b, card2c]
card2a = {
  title: "#1 · Avatar (2009) — $2.92B",
  body: "#1 All-Time Record. Theatrical spectacle with extraordinary international reach.",
  imageSrc: "https://m.media-amazon.com/images/M/MV5BMDEzMmQwZjctZWU2My00MWNlLWE0NjItMDJlYTRlNGJiZjcyXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg"
}
card2b = {
  title: "#2 · Avengers: Endgame (2019) — $2.80B",
  body: "#2 MCU Peak. The payoff to an unprecedented connected-film narrative.",
  imageSrc: "https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_FMjpg_UX1000_.jpg"
}
card2c = {
  title: "#3 · Avatar: The Way of Water (2022) — $2.33B",
  body: "#3 Cameron Returns. Premium formats and a sustained long theatrical run.",
  imageSrc: "https://m.media-amazon.com/images/M/MV5BNWI0Y2NkOWEtMmM2OC00MjQ3LWI1YzItZGQxYzQ3NzI4NWZmXkEyXkFqcGc@._V1_.jpg"
}

slide3 = Slide("slide-3", content3)
content3 = ChartWithMetrics("Three Films. $8.06 Billion.", metrics3, chart3)
metrics3 = [metric3a, metric3b, metric3c, metric3d]
metric3a = {
  metric: "$8.06B",
  description: "Combined gross across top 3 films"
}
metric3b = {
  metric: "$2.69B",
  description: "Average gross per film"
}
metric3c = {
  metric: "3 Films",
  description: "Holding the all-time podium"
}
metric3d = {
  metric: "13 Years",
  description: "2009 to 2022 timeline span"
}

chart3 = BarChartV2(chartData3, "Film", "USD Billions")
chartData3 = {
  data: {
    labels: ["Avatar", "Avengers: Endgame", "Avatar: Way of Water"],
    series: [series3]
  },
  unit: "b"
}
series3 = {
  category: "Worldwide Gross",
  values: [2.92, 2.80, 2.33]
}

slide4 = Slide("slide-4", content4)
content4 = ChartWithContext("Domestic Is Not the Story", chart4, "Global theatrical reach separates these films from ordinary blockbusters. ~71% of revenue came from international markets, earning more abroad than any domestic release in the same year.", "title-body-left")

chart4 = BarChartV2(chartData4, "Film", "USD Billions")
chartData4 = {
  data: {
    labels: ["Avatar", "Avengers: Endgame", "Avatar: Way of Water"],
    series: [series4a, series4b]
  },
  unit: "b"
}
series4a = {
  category: "Domestic",
  values: [0.79, 0.86, 0.69]
}
series4b = {
  category: "International",
  values: [2.14, 1.94, 1.65]
}

slide5 = Slide("slide-5", content5)
content5 = KeyInfoWithTitle("One Director. Two Records.", infoItems5, "horizontal-grid")
infoItems5 = [item5a, item5b, item5c, item5d]
item5a = {
  title: "2 of Top 3",
  description: "James Cameron holds two positions on the all-time worldwide podium."
}
item5b = {
  title: "$5.25 Billion",
  description: "Combined gross of the Avatar franchise from just two releases."
}
item5c = {
  title: "≈ 65% Share",
  description: "Cameron's portion of total revenue generated by the top three films."
}
item5d = {
  title: "13 Years Gap",
  description: "Between Avatar releases, proving long-term brand equity and anticipation."
}

slide6 = Slide("slide-6", content6)
content6 = ChartWithMetrics("Volume vs. Efficiency", metrics6, chart6)
metrics6 = [metric6a, metric6b]
metric6a = {
  metric: "$2.63B / film",
  description: "Avatar average efficiency"
}
metric6b = {
  metric: "3.0x",
  description: "Efficiency vs next closest franchise"
}

chart6 = BarChartV2(chartData6, "Franchise", "USD Billions")
chartData6 = {
  data: {
    labels: ["MCU (~38 films)", "Star Wars (~12 films)", "Wizarding World (~10)", "James Bond (~25)", "Avatar (2 films)"],
    series: [series6]
  },
  unit: "b"
}
series6 = {
  category: "Total Franchise Gross",
  values: [33.4, 10.3, 8.8, 7.9, 5.25]
}

slide7 = Slide("slide-7", content7)
content7 = SectionBreakDramatic("Make It Unmissable", "Spectacle creates a reason to choose the largest screen. Global releases turn opening weekend into a shared cultural event, while premium formats extend lifetime value.", "vertical", "https://www.nseled.com/wp-content/uploads/2026/02/Immersive-cinema-experience-with-ultra-wide-curved-LED-display.jpg")`;

const BUSINESS_HEALTH_REPORT_PROGRAM = `root = ReportView("Q2 Business Health", "Executive operating review · Illustrative data", [cover, executive, performance, customers, actions])
cover = Page("cover", StandardFrontPage("Q2 Business Health", "${DEMO_IMAGES.dashboard}", coverCopy, "April–June 2026", "title-left"))
coverCopy = TextContent("A decision-ready view of growth, efficiency, customer health, and the priorities leadership should carry into Q3.")
executive = Page("executive", ContentPage([executiveHeader, metrics, executiveStatement]))
executiveHeader = InlineHeader("Executive summary", "Growth finished ahead of plan without weakening retention or gross margin.")
metrics = KeyMetrics("row", [{title: "Revenue", text: "$1.40M"}, {title: "Gross margin", text: "72%"}, {title: "Retention", text: "94%"}, {title: "Pipeline", text: "3.2×"}])
executiveStatement = HeadlineStatement("The quarter closed 6% above plan", "Expansion revenue offset a slower enterprise sales cycle while the company preserved pricing discipline.", "default")
performance = Page("performance", ContentPage([performanceHeader, revenueChart]))
performanceHeader = InlineHeader("Revenue versus target", "Actual monthly revenue accelerated through the quarter.")
revenueChart = BarChartV2({data: {labels: ["April", "May", "June"], series: [{category: "Actual", values: [420, 468, 515]}, {category: "Target", values: [400, 445, 490]}]}, unit: "k"}, "grouped", false, "Month", "Revenue")
customers = Page("customers", ContentPage([customerHeader, customerMix, customerImage]))
customerHeader = InlineHeader("A durable revenue base", "Existing customers still contribute most of the quarter's recurring revenue.")
customerMix = PieChartV2({data: [{category: "Renewal", value: 58}, {category: "Expansion", value: 24}, {category: "New logo", value: 18}]})
customerImage = Image("${DEMO_IMAGES.collaboration}", "Team reviewing business performance")
actions = Page("actions", ContentPage([actionsHeader, actionPoints]))
actionsHeader = InlineHeader("Decisions for Q3", "Three actions protect the plan while preserving efficient growth.")
actionPoints = NumberedKeyPoint("column", [{title: "Shorten enterprise cycles", body: "Add executive sponsorship to the largest late-stage opportunities."}, {title: "Protect pricing", body: "Review discounts above the operating threshold."}, {title: "Expand healthy accounts", body: "Prioritize strong adoption and near-term renewals."}])`;

const PRODUCT_DECISION_REPORT_PROGRAM = `root = ReportView("Project Platform Decision Brief", "Recommendation for a 25-person product organization", [cover, recommendation, comparison, scoring, rollout])
cover = Page("cover", StandardFrontPage("Project Platform Decision Brief", "${DEMO_IMAGES.planning}", coverCopy, "Prepared for product and engineering leadership", "title-left"))
coverCopy = TextContent("A concise comparison of Starter, Growth, and Enterprise plans using collaboration, governance, automation, and operating-cost criteria.")
recommendation = Page("recommendation", ContentPage([recommendationHeader, recommendationMetric, recommendationStatement]))
recommendationHeader = InlineHeader("Recommendation", "Choose Growth now and define explicit triggers for a future Enterprise migration.")
recommendationMetric = HeroMetric("Growth", "Best balance of cross-team planning, automation, and manageable administration", "row", "${DEMO_IMAGES.office}")
recommendationStatement = KeyStatement("Enterprise controls are valuable, but the current team size does not justify the added cost and governance overhead.")
comparison = Page("comparison", ContentPage([comparisonHeader, comparisonTable]))
comparisonHeader = InlineHeader("Plan comparison", "Scored against the needs of five collaborating product squads.")
comparisonTable = Table([Column("Capability"), Column("Starter"), Column("Growth"), Column("Enterprise")], [["Roadmaps", "Basic", "Advanced", "Advanced"], ["Automation", "5 rules", "Unlimited", "Unlimited"], ["Permissions", "Workspace", "Team", "Organization"], ["Audit history", "None", "90 days", "1 year"], ["Relative cost", "Low", "Medium", "High"]])
scoring = Page("scoring", ContentPage([scoringHeader, scoreChart]))
scoringHeader = InlineHeader("Weighted decision score", "Illustrative score across fit, governance, automation, and cost.")
scoreChart = BarChartV2({data: {labels: ["Starter", "Growth", "Enterprise"], series: [{category: "Score", values: [62, 86, 78]}]}}, "grouped", true, "Plan", "Score")
rollout = Page("rollout", ContentPage([rolloutHeader, rolloutCards]))
rolloutHeader = InlineHeader("30-day rollout", "Adopt the plan without importing process debt.")
rolloutCards = VisualCards([{title: "Define", body: "Agree on issue types, ownership, and required fields.", imageSrc: "${DEMO_IMAGES.planning}"}, {title: "Pilot", body: "Test the workflow with two squads before scaling.", imageSrc: "${DEMO_IMAGES.collaboration}"}, {title: "Measure", body: "Review cycle time, automation, and reporting completeness.", imageSrc: "${DEMO_IMAGES.dashboard}"}])`;

const COFFEE_TRENDS_REPORT_PROGRAM = `root = ReportView("Global Coffee Trends", "Consumer behavior and category opportunities · Illustrative 2026 outlook", [cover, signals, growth, occasions, actions])
cover = Page("cover", StandardFrontPage("Global Coffee Trends", "${DEMO_IMAGES.coffee}", coverCopy, "Illustrative market outlook", "title-left"))
coverCopy = TextContent("Four demand shifts shaping the next wave of café, retail, and ready-to-drink growth.")
signals = Page("signals", ContentPage([signalsHeader, signalMetrics, signalImage]))
signalsHeader = InlineHeader("Category signals", "Convenience is growing without displacing premium experiences.")
signalMetrics = KeyMetrics("row", [{title: "Cold formats", text: "+18%"}, {title: "At-home premium", text: "+12%"}, {title: "Functional blends", text: "+9%"}, {title: "Traceability", text: "Top 3"}])
signalImage = Image("${DEMO_IMAGES.coffeeBeans}", "Roasted coffee beans")
growth = Page("growth", ContentPage([growthHeader, growthChart]))
growthHeader = InlineHeader("Cold coffee is the growth engine", "Illustrative category index, 2023 baseline = 100.")
growthChart = LineChartV2({data: {labels: ["2023", "2024", "2025", "2026"], series: [{category: "Cold coffee", values: [100, 118, 139, 160]}, {category: "Total coffee", values: [100, 105, 111, 117]}]}}, "Year", "Category index")
occasions = Page("occasions", ContentPage([occasionHeader, occasionMix, occasionCards]))
occasionHeader = InlineHeader("Demand is organized by occasion", "Formats win when they have a clear job to do.")
occasionMix = PieChartV2({data: [{category: "Morning utility", value: 38}, {category: "Home ritual", value: 27}, {category: "Afternoon reset", value: 21}, {category: "Social discovery", value: 14}]})
occasionCards = VisualCards([{title: "Cold and portable", body: "Speed and refreshment lead the commuting occasion.", imageSrc: "${DEMO_IMAGES.coffee}"}, {title: "Craft at home", body: "Whole bean and equipment turn preparation into ritual.", imageSrc: "${DEMO_IMAGES.coffeeBeans}"}, {title: "Signature café", body: "Distinctive drinks make social visits feel discoverable.", imageSrc: "${DEMO_IMAGES.coffee}"}])
actions = Page("actions", ContentPage([actionsHeader, actionsList]))
actionsHeader = InlineHeader("Three moves for operators", "Translate the signals into a focused portfolio.")
actionsList = NumberedKeyPoint("column", [{title: "Design by occasion", body: "Give each format a clear job."}, {title: "Make sourcing visible", body: "Use concise origin proof at the point of choice."}, {title: "Prototype cold and functional", body: "Test before adding permanent complexity."}])`;

const WORLD_CUP_DECK_PROGRAM = `root = SlideShow("World Cup 2026 Viewing Guide", "A host-city-first way to experience the tournament", [cover, scale, bases, matchday, itinerary, close])
cover = Slide("cover", DramaticTitle("World Cup 2026", "A host-city-first viewing guide", "Three countries. Sixteen cities. One summer.", null, "title-bottom", "${DEMO_IMAGES.stadium}"))
scale = Slide("scale", ChartWithContext("Sixteen host cities", BarChartV2({data: {labels: ["United States", "Mexico", "Canada"], series: [{category: "Host cities", values: [11, 3, 2]}]}}, "Country", "Host cities"), "Most routes work best as one regional cluster rather than a cross-continent sprint.", "title-body-top"))
bases = Slide("bases", VisualCards("Choose a tournament base", [{title: "Northeast", body: "Dense connections and several nearby venues.", imageSrc: "${DEMO_IMAGES.stadium}"}, {title: "West Coast", body: "Iconic cities paired with longer travel distances.", imageSrc: "${DEMO_IMAGES.stadium}"}, {title: "Mexico", body: "Historic football culture and high-energy hosts.", imageSrc: "${DEMO_IMAGES.stadium}"}]))
matchday = Slide("matchday", ListWithImage("Build a resilient matchday", [{iconName: "Train", primaryText: "Stay on rapid transit", body: "Optimize for the full day, not stadium proximity alone."}, {iconName: "Calendar", primaryText: "Protect recovery time", body: "Leave a buffer between cities."}, {iconName: "Ticket", primaryText: "Use official sources", body: "Keep ticketing as the single source of truth."}], ["${DEMO_IMAGES.stadium}"]))
itinerary = Slide("itinerary", MetricsWithImage("A balanced seven-day shape", [{metric: "2 cities", description: "One regional cluster"}, {metric: "2 matches", description: "With recovery time"}, {metric: "3 open days", description: "For the host cities"}], ["${DEMO_IMAGES.stadium}"]))
close = Slide("close", HeroMetric("Plan the route", "The best tournament trip leaves room for the cities around the football.", "vertical", "${DEMO_IMAGES.stadium}"))`;

const PRODUCT_LAUNCH_DECK_PROGRAM = `root = SlideShow("AI Product Launch Plan", "From beta signal to repeatable adoption", [cover, audiences, sequence, scorecard, proof, close])
cover = Slide("cover", DramaticTitle("AI Product Launch", "From beta signal to repeatable adoption", "A focused six-week go-to-market motion", null, "title-bottom", "${DEMO_IMAGES.ai}"))
audiences = Slide("audiences", VisualCards("Three launch audiences", [{title: "Design partners", body: "Validate workflows and produce credible proof.", imageSrc: "${DEMO_IMAGES.collaboration}"}, {title: "Power users", body: "Create repeatable templates and community momentum.", imageSrc: "${DEMO_IMAGES.technology}"}, {title: "Team leads", body: "Convert individual use into team adoption.", imageSrc: "${DEMO_IMAGES.office}"}]))
sequence = Slide("sequence", ListWithImage("The six-week sequence", [{iconName: "Sparkles", primaryText: "Weeks 1–2 · Prove", body: "Onboarding and reference stories."}, {iconName: "Megaphone", primaryText: "Weeks 3–4 · Launch", body: "Public release and guided templates."}, {iconName: "Users", primaryText: "Weeks 5–6 · Expand", body: "Team adoption and lifecycle automation."}], ["${DEMO_IMAGES.ai}", "${DEMO_IMAGES.planning}"]))
scorecard = Slide("scorecard", ChartWithMetrics("Activation path", [{metric: "1,000", description: "Activated-team goal"}, {metric: "35%", description: "Week-two retention"}], LineChartV2({data: {labels: ["Week 1", "Week 2", "Week 4", "Week 6"], series: [{category: "Activated teams", values: [180, 420, 730, 1000]}]}}, "Launch week", "Teams")))
proof = Slide("proof", ContentWithImage("Build proof loops", ["${DEMO_IMAGES.dashboard}", "${DEMO_IMAGES.collaboration}"], "Turn design-partner outcomes into templates, stories, and onboarding guidance that shorten time to first value.", "image-right"))
close = Slide("close", HeroMetric("Earn the second session", "Reach creates awareness; a repeatable workflow creates adoption.", "vertical", "${DEMO_IMAGES.technology}"))`;

const STOCK_ARTIFACT = createDemoArtifact({
  id: "demo_artifact_big_tech_2025",
  title: "Big Tech 2025 Report Card",
  type: "report",
  threadId: "demo_stock_comparison",
  updatedAt: "2026-01-02T12:00:00.000Z",
  program: STOCK_REPORT_PROGRAM,
});

const TRAVEL_ARTIFACT = createDemoArtifact({
  id: "demo_artifact_japan_highlights",
  title: "Must-See Japan",
  type: "slides",
  threadId: "demo_catalog_japan_highlights",
  updatedAt: "2026-06-28T12:00:00.000Z",
  program: TRAVEL_DECK_PROGRAM,
});

const BLOCKBUSTER_ARTIFACT = createDemoArtifact({
  id: "demo_artifact_blockbuster_box_office",
  title: "Blockbuster Box Office: Event Cinema Economics",
  type: "slides",
  threadId: "demo_blockbusters",
  updatedAt: "2026-08-07T12:00:00.000Z",
  program: BLOCKBUSTER_DECK_PROGRAM,
});

const BUSINESS_HEALTH_ARTIFACT = createDemoArtifact({
  id: "demo_artifact_q2_business_health",
  title: "Q2 Business Health",
  type: "report",
  threadId: "demo_catalog_q2_business_health",
  updatedAt: "2026-06-30T12:00:00.000Z",
  program: BUSINESS_HEALTH_REPORT_PROGRAM,
});

const PRODUCT_DECISION_ARTIFACT = createDemoArtifact({
  id: "demo_artifact_project_platform_brief",
  title: "Project Platform Decision Brief",
  type: "report",
  threadId: "demo_catalog_project_platform_brief",
  updatedAt: "2026-06-29T12:00:00.000Z",
  program: PRODUCT_DECISION_REPORT_PROGRAM,
});

const COFFEE_TRENDS_ARTIFACT = createDemoArtifact({
  id: "demo_artifact_global_coffee_trends",
  title: "Global Coffee Trends",
  type: "report",
  threadId: "demo_catalog_global_coffee_trends",
  updatedAt: "2026-06-27T12:00:00.000Z",
  program: COFFEE_TRENDS_REPORT_PROGRAM,
});

const WORLD_CUP_ARTIFACT = createDemoArtifact({
  id: "demo_artifact_world_cup_2026_guide",
  title: "World Cup 2026 Viewing Guide",
  type: "slides",
  threadId: "demo_catalog_world_cup_2026_guide",
  updatedAt: "2026-06-25T12:00:00.000Z",
  program: WORLD_CUP_DECK_PROGRAM,
});

const PRODUCT_LAUNCH_ARTIFACT = createDemoArtifact({
  id: "demo_artifact_ai_product_launch",
  title: "AI Product Launch Plan",
  type: "slides",
  threadId: "demo_catalog_ai_product_launch",
  updatedAt: "2026-06-24T12:00:00.000Z",
  program: PRODUCT_LAUNCH_DECK_PROGRAM,
});

export const DEMO_ARTIFACTS: readonly DemoArtifact[] = [
  STOCK_ARTIFACT,
  BUSINESS_HEALTH_ARTIFACT,
  PRODUCT_DECISION_ARTIFACT,
  COFFEE_TRENDS_ARTIFACT,
  BLOCKBUSTER_ARTIFACT,
  TRAVEL_ARTIFACT,
  WORLD_CUP_ARTIFACT,
  PRODUCT_LAUNCH_ARTIFACT,
];

export const DEMO_CONVERSATIONS: readonly DemoConversation[] = [
  {
    id: "demo_stock_comparison",
    slug: "stock-comparison",
    title: "Stock comparison",
    description: "Meta, Microsoft, Netflix, and Google versus the S&P 500 in 2025",
    icon: "analytics",
    sourcePrompt:
      "Compare Meta, Microsoft, Netflix, and Google for 2025. How did they do against the S&P 500?",
    recordedModel: DEFAULT_MODEL,
    linkedArtifactId: STOCK_ARTIFACT.id,
    messages: [
      {
        id: "demo_stock_comparison_user_1",
        role: "user",
        content:
          "Compare Meta, Microsoft, Netflix, and Google for 2025. How did they do against the S&P 500?",
      },
      {
        id: "demo_stock_comparison_assistant_1",
        role: "assistant",
        content: `root = Card([header, stockCards, trendChart, ytdBars, snapshotTable, sourcesLabel, sources, note])
sourcesLabel = TextContent("Sources", "small-heavy")
sources = SnippetCardBlock([nasdaqSource, reutersSource, ibdSource], "grid")
nasdaqSource = SnippetCardItem("src-nasdaq", ImageText("https://www.google.com/s2/favicons?domain=nasdaq.com&sz=64", "Nasdaq logo", "Nasdaq / Zacks", "How Big Tech Stocks Performed in 2025"))
reutersSource = SnippetCardItem("src-reuters", ImageText("https://www.google.com/s2/favicons?domain=reuters.com&sz=64", "Reuters logo", "Reuters", "Alphabet Leads Big Tech's 2025 Rally"))
ibdSource = SnippetCardItem("src-ibd", ImageText("https://www.google.com/s2/favicons?domain=investors.com&sz=64", "Investor's Business Daily logo", "Investor's Business Daily", "Magnificent Seven Report Card: 2025"))
header = Header("Meta, Microsoft, Netflix, Google in 2025", "Full-year returns vs. the S&P 500 · Data as of Dec 31, 2025")
stockCards = SnippetCardBlock([metaCard, msftCard, nflxCard, googCard, spyCard], "grid")
metaCard = SnippetCardItem("meta", IconText(metaIcon, "success", "md", "Meta (META)", "Social & AI"), BoldText("number", "+9%", "2025 Full Year", "text", "md"))
msftCard = SnippetCardItem("msft", IconText(msftIcon, "success", "md", "Microsoft (MSFT)", "Software & Cloud"), BoldText("number", "+21%", "2025 Full Year", "text", "md"))
nflxCard = SnippetCardItem("nflx", IconText(nflxIcon, "success", "md", "Netflix (NFLX)", "Streaming"), BoldText("number", "+14%", "2025 Full Year", "text", "md"))
googCard = SnippetCardItem("goog", IconText(googIcon, "success", "md", "Google (GOOGL)", "Search & AI"), BoldText("number", "+66%", "2025 Full Year", "text", "md"))
spyCard = SnippetCardItem("spy", IconText(spyIcon, "neutral", "md", "S&P 500 (SPY)", "Benchmark"), BoldText("number", "+17%", "2025 Full Year", "text", "md"))
metaIcon = Icon("users")
msftIcon = Icon("cloud")
nflxIcon = Icon("tv")
googIcon = Icon("search")
spyIcon = Icon("activity")
trendChart = LineChart(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], [{category: "META", values: [10, 14, 8, 12, 18, 22, 25, 28, 22, 12, 5, 9]}, {category: "MSFT", values: [4, 6, 2, 8, 14, 18, 22, 24, 20, 18, 19, 21]}, {category: "NFLX", values: [8, 12, 15, 18, 22, 20, 16, 12, 8, 6, 10, 14]}, {category: "GOOGL", values: [3, 0, -8, -6, 2, 8, 14, 22, 32, 42, 55, 66]}, {category: "S&P 500", values: [2, 0, -5, -2, 4, 7, 10, 12, 13, 15, 16, 17]}], "default", "natural", "Monthly Cumulative Return: 2025 Trendlines", "Indexed to 0% at Jan 1, 2025 · Each line shows cumulative % gain relative to year start", "Month (2025)", "Cumulative Return (%)", "%")
ytdBars = HorizontalBarChart(["Meta (META)", "Microsoft (MSFT)", "Netflix (NFLX)", "Google (GOOGL)", "S&P 500 (Benchmark)"], [{category: "2025 Return (%)", values: [9, 21, 14, 66, 17]}], "Full-Year 2025 Return vs. S&P 500", "Final year-end total return for each stock", "Return (%)", "Stock", "%", "grouped")
snapshotTable = Table([stockCol, tickerCol, ytdCol, sectorCol, driverCol], [["Meta Platforms", "META", "+9%", commTag1, metaDriver], ["Microsoft", "MSFT", "+21%", techTag, msftDriver], ["Netflix", "NFLX", "+14%", commTag2, nflxDriver], ["Alphabet (Google)", "GOOGL", "+66%", commTag3, googDriver]])
commTag1 = Tag("Comm. Services", "neutral")
commTag2 = Tag("Comm. Services", "neutral")
commTag3 = Tag("Comm. Services", "neutral")
techTag = Tag("Technology", "info")
metaDriver = Tag("AI-Powered Ads", "success")
msftDriver = Tag("Azure & Copilot", "success")
nflxDriver = Tag("Ads Tier Momentum", "success")
googDriver = Tag("Gemini & Cloud", "success")
stockCol = Col("Stock")
tickerCol = Col("Ticker")
ytdCol = Col("2025 Return")
sectorCol = Col("Sector")
driverCol = Col("Key Driver")
note = CalloutV2("neutral", "For demonstration only", "Full-year 2025 figures are for demonstration, not investment advice.")`,
      },
      {
        id: "demo_stock_comparison_user_2",
        role: "user",
        content: "Can you deep dive into Netflix?",
      },
      {
        id: "demo_stock_comparison_assistant_2",
        role: "assistant",
        content: `root = Card([header, metricCards, chartTabs, driversHeading, driverCards, risksHeading, riskCards, disclaimer])
disclaimer = CalloutV2("neutral", "Illustrative data only", "Figures and events in this deep dive are illustrative, for demonstration and not investment advice.")
header = Header("Netflix (NFLX) 2025 Deep Dive", "Full-year financial & stock performance · Fiscal Year 2025")
metricCards = SnippetCardBlock([revCard, marginCard, memberCard, stockCard], "grid")
revCard = SnippetCardItem("rev", IconText(revIcon, "neutral", "md", "Full-Year Revenue", "FY 2025"), BoldText("number", "$45.2B", "+16% YoY", "metric", "md"))
marginCard = SnippetCardItem("margin", IconText(marginIcon, "neutral", "md", "Operating Margin", "FY 2025"), BoldText("number", "29.5%", "+3 pts YoY", "metric", "md"))
memberCard = SnippetCardItem("members", IconText(memberIcon, "neutral", "md", "Paid Memberships", "End of Q4 2025"), BoldText("number", "325M+", "Milestone", "text", "md"))
stockCard = SnippetCardItem("stock", IconText(stockIcon, "success", "md", "Stock Return", "Full-Year 2025"), BoldText("number", "+14%", "vs. S&P +17%", "metric", "md"))
revIcon = Icon("dollar-sign")
marginIcon = Icon("trending-up")
memberIcon = Icon("users")
stockIcon = Icon("arrow-up-right")
chartTabs = Tabs([priceTab, subsTab, revSpendTab])
priceTab = TabItem("price", "Stock Price", [priceChart])
priceChart = AreaChart(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], [{category: "NFLX close", values: [961, 997, 1024, 1050, 1086, 1068, 1032, 997, 961, 943, 979, 1015]}], "default", "natural", "NFLX share price, 2025", "Monthly close in US dollars", "Month (2025)", "Price ($)", "$")
subsTab = TabItem("subs", "Subscribers", [subsChart])
subsChart = BarChart(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], [{category: "Paid memberships", values: [303, 305, 307, 309, 310, 313, 315, 317, 320, 321, 323, 325]}], "default", "grouped", "Paid memberships", "Millions, end of month", "Month (2025)", "Members (M)", "M")
revSpendTab = TabItem("revspend", "Revenue vs Spend", [revSpendChart])
revSpendChart = BarChart(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], [{category: "Revenue", values: [3.4, 3.5, 3.6, 3.6, 3.7, 3.8, 3.8, 3.85, 3.9, 3.95, 4.0, 4.1]}, {category: "Content spend", values: [1.2, 1.3, 1.4, 1.4, 1.4, 1.5, 1.5, 1.5, 1.6, 1.7, 1.7, 1.8]}], "default", "grouped", "Revenue vs. content spend", "US dollars in billions per month", "Month (2025)", "USD (B)", "B")
driversHeading = InlineHeader("Key Growth Drivers", "What powered the 2025 results")
driverCards = CompositeCardBlock([pricingCard, adsBizCard, contentCard, wbCard], "grid")
pricingCard = CompositeCardItem("pricing", IconText(pricingIcon, "success", "md", "Pricing Power", "Higher ARPU across regions"), [pricingBody])
pricingBody = TextContent("Multiple price increases in the US and globally contributed to higher average revenue per membership, complementing subscriber growth.")
pricingIcon = Icon("dollar-sign")
adsBizCard = CompositeCardItem("ads-biz", IconText(adsBizIcon, "info", "md", "Ads Business", "Scaled ad platform & 2.5x revenue growth"), [adsBizBody])
adsBizBody = TextContent("Ad revenue surpassed $1.5B, more than 2.5x the 2024 level. Netflix Ads Suite, its proprietary first-party ad tech platform, completed global rollout in Q2 2025.")
adsBizIcon = Icon("megaphone")
contentCard = CompositeCardItem("content", IconText(contentIcon, "warning", "md", "Content Slate", "Blockbuster originals & live events"), [contentBody])
contentBody = TextContent("Hit titles including Squid Game S3, Wednesday S2, the Stranger Things finale, Happy Gilmore 2, and the Canelo-Crawford live boxing match drove outsized engagement.")
contentIcon = Icon("clapperboard")
wbCard = CompositeCardItem("wb", IconText(wbIcon, "neutral", "md", "Warner Bros. Acquisition", "Major strategic expansion announced Q4 2025"), [wbBody])
wbBody = TextContent("Netflix announced an all-cash acquisition of Warner Bros. at $27.75 per share, expanding its content library and accelerating its push into major studio properties.")
wbIcon = Icon("film")
risksHeading = InlineHeader("Risks & Headwinds", "What could challenge the story")
riskCards = CompositeCardBlock([compCard, perfCard], "grid")
compCard = CompositeCardItem("comp", IconText(compIcon, "warning", "md", "Streaming Competition", "Disney+, Max, Apple TV+, YouTube"), [compBody])
compBody = TextContent("Intensifying competition from Disney+, Max, Apple TV+, and YouTube continues to pressure churn and content spend, especially in the mature US market.")
compIcon = Icon("swords")
perfCard = CompositeCardItem("perf", IconText(perfIcon, "danger", "md", "Relative Performance", "NFLX +14% vs. S&P 500 +17%"), [perfBody])
perfBody = TextContent("Despite strong fundamentals, NFLX stock trailed the S&P 500 in 2025 (+14% vs. +17%), reflecting peak-multiple concerns and Warner Bros. deal uncertainty.")
perfIcon = Icon("trending-down")`,
      },
      {
        id: "demo_stock_comparison_user_3",
        role: "user",
        content: "Package this into a shareable report.",
      },
      ...createArtifactTurn(
        "demo_stock_comparison",
        STOCK_ARTIFACT,
        "I turned the four-stock comparison into a nine-page report covering benchmark-relative returns, company drivers, a Netflix deep dive, risks, and the 2026 watchlist.",
      ),
    ],
  },
  {
    id: "demo_travel_planner",
    slug: "japan-travel-guide",
    title: "Japan travel guide",
    description: "Must-see places in Japan with photos, highlights, and tips",
    icon: "travel",
    sourcePrompt: "Suggest must-see places in Japan.",
    recordedModel: DEFAULT_MODEL,
    messages: [
      {
        id: "demo_travel_planner_user_1",
        role: "user",
        content: "Suggest must-see places in Japan.",
      },
      {
        id: "demo_travel_planner_assistant_1",
        role: "assistant",
        content: `root = Card([header, intro, placeCards, highlightsHeader, highlightTabs, followUps])
followUps = ButtonGroup([planChipButton, seasonChipButton, foodChipButton], "row")
planChipButton = Button("Help me plan a trip", {type: "continue_conversation"}, "secondary", "normal", "small")
seasonChipButton = Button("What's the best season to visit?", {type: "continue_conversation"}, "secondary", "normal", "small")
foodChipButton = Button("Where should I eat in Tokyo?", {type: "continue_conversation"}, "secondary", "normal", "small")
header = Header("Must-See Places in Japan", "Iconic destinations from buzzing cities to serene temples")
intro = TextContent("Japan offers an unmatched blend of ancient tradition, modern innovation, and breathtaking nature. Here are the top destinations every traveller should experience.")
placeCards = VisualCardBlock([tokyoCard, fujiCard, kyotoCard], "grid")
tokyoCard = VisualCardItem(tokyoCardBody, "tokyo", "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80&auto=format&fit=crop", mustSeeTag, "Neon streets of Tokyo at night")
mustSeeTag = Tag("Must-See", "neutral")
tokyoCardBody = BoldText("text", "Tokyo", "Japan's futuristic capital", "text", "md")
fujiCard = VisualCardItem(fujiCardBody, "fuji", "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=1200&q=80&auto=format&fit=crop", wonderTag, "Mount Fuji rising over the countryside")
wonderTag = Tag("Natural Wonder", "neutral")
fujiCardBody = BoldText("text", "Mount Fuji", "Japan's iconic sacred peak", "text", "md")
kyotoCard = VisualCardItem(kyotoCardBody, "kyoto", "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=1200&q=80&auto=format&fit=crop", culturalTag, "Historic streets and temples of Kyoto")
culturalTag = Tag("Cultural", "neutral")
kyotoCardBody = BoldText("text", "Kyoto", "Thousands of shrines & temples", "text", "md")
highlightsHeader = InlineHeader("What to Do in Japan", "Food, shopping, and entertainment picks")
highlightTabs = Tabs([foodTab, shoppingTab, entertainmentTab])
foodTab = TabItem("food", "Food", [foodCards])
foodCards = CompositeCardBlock([streetFood, sushiCard], "grid")
streetFood = CompositeCardItem("street-food", ImageTextLarge("https://images.unsplash.com/photo-1590559899731-a382839e5549?w=1200&q=80&auto=format&fit=crop", "Dotonbori street food district in Osaka", "Street Food", "Takoyaki, ramen & market snacks"), [streetFoodCopy, streetFoodList, streetFoodTags])
streetFoodCopy = TextContent("Japan's street food is a destination in itself. Osaka's Dotonbori and covered markets serve some of the country's most loved quick bites.")
streetFoodList = List([streetSpot1, streetSpot2, streetSpot3])
streetSpot1 = ListItem("Takoyaki in Dotonbori", "Octopus balls from the original stalls")
streetSpot2 = ListItem("Kuromon Market", "Grilled seafood and wagyu skewers")
streetSpot3 = ListItem("Standing ramen bars", "Quick, cheap, and unforgettable")
streetFoodTags = TagBlock([cheapEatsTag, localTag])
cheapEatsTag = Tag("Cheap Eats", "success")
localTag = Tag("Local Favorite", "info")
sushiCard = CompositeCardItem("sushi", ImageTextLarge("https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=80&auto=format&fit=crop", "Fresh sushi platter", "Sushi & Izakaya", "From market breakfasts to late-night alleys"), [sushiCopy, sushiList, sushiTags])
sushiCopy = TextContent("Eat sushi where it was perfected. Start with a market breakfast, then spend an evening hopping izakaya alleys in Shinjuku.")
sushiList = List([sushiSpot1, sushiSpot2, sushiSpot3])
sushiSpot1 = ListItem("Toyosu & Tsukiji outer market", "The freshest breakfast in Tokyo")
sushiSpot2 = ListItem("Conveyor-belt sushi", "Fun, fast, and budget-friendly")
sushiSpot3 = ListItem("Omoide Yokocho", "Tiny izakaya under the rail tracks")
sushiTags = TagBlock([mustTryTag, freshTag])
mustTryTag = Tag("Must-Try", "warning")
freshTag = Tag("Fresh Daily", "success")
shoppingTab = TabItem("shopping", "Shopping", [shoppingCards])
shoppingCards = CompositeCardBlock([tokyoShopping, marketShopping], "grid")
tokyoShopping = CompositeCardItem("tokyo-shopping", ImageTextLarge("https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&q=80&auto=format&fit=crop", "Busy shopping street in Tokyo", "Tokyo Shopping", "Fashion, gadgets & flagship stores"), [tokyoShopCopy, tokyoShopList, tokyoShopTags])
tokyoShopCopy = TextContent("From Shibuya fashion floors to Ginza flagships and 24-hour discount stores, Tokyo covers every kind of shopping trip.")
tokyoShopList = List([shopSpot1, shopSpot2, shopSpot3])
shopSpot1 = ListItem("Shibuya & Harajuku", "Streetwear and youth fashion")
shopSpot2 = ListItem("Ginza flagships", "Luxury brands and department stores")
shopSpot3 = ListItem("Don Quijote", "Late-night souvenir and snack runs")
tokyoShopTags = TagBlock([fashionTag, taxFreeTag])
fashionTag = Tag("Fashion", "info")
taxFreeTag = Tag("Tax-Free", "success")
marketShopping = CompositeCardItem("market-shopping", ImageTextLarge("https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80&auto=format&fit=crop", "Traditional shopping street in Japan", "Markets & Crafts", "Souvenirs with a story"), [marketCopy, marketList, marketTags])
marketCopy = TextContent("For gifts worth keeping, skip the airport shop. Japan's craft markets sell ceramics, knives, and tea you will actually use.")
marketList = List([marketSpot1, marketSpot2, marketSpot3])
marketSpot1 = ListItem("Nishiki Market, Kyoto", "Four hundred years of food stalls")
marketSpot2 = ListItem("Nakamise-dori, Asakusa", "Classic souvenirs by Senso-ji")
marketSpot3 = ListItem("Kappabashi Street", "Chef knives and kitchenware")
marketTags = TagBlock([souvenirTag, traditionalTag])
souvenirTag = Tag("Souvenirs", "neutral")
traditionalTag = Tag("Traditional", "warning")
entertainmentTab = TabItem("entertainment", "Entertainment", [entertainmentCards])
entertainmentCards = CompositeCardBlock([arcadeCard, showsCard], "grid")
arcadeCard = CompositeCardItem("arcades", ImageTextLarge("https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80&auto=format&fit=crop", "Neon arcade machines", "Arcades & Karaoke", "Japan's night out, perfected"), [arcadeCopy, arcadeList, arcadeTags])
arcadeCopy = TextContent("Multi-floor arcades, claw machines, and private karaoke rooms make Japanese nights out unlike anywhere else.")
arcadeList = List([arcadeSpot1, arcadeSpot2, arcadeSpot3])
arcadeSpot1 = ListItem("Round1 arcades", "Rhythm games and crane machines")
arcadeSpot2 = ListItem("Karaoke boxes", "Private rooms, all-night sessions")
arcadeSpot3 = ListItem("Akihabara", "Retro game floors and electronics")
arcadeTags = TagBlock([nightOutTag, groupFunTag])
nightOutTag = Tag("Nightlife", "info")
groupFunTag = Tag("Group Fun", "success")
showsCard = CompositeCardItem("shows", ImageTextLarge("https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=80&auto=format&fit=crop", "Traditional Japanese scene", "Shows & Experiences", "Only-in-Japan moments"), [showsCopy, showsList, showsTags])
showsCopy = TextContent("Round out the trip with experiences you cannot get anywhere else, from digital art museums to a sumo tournament afternoon.")
showsList = List([showSpot1, showSpot2, showSpot3])
showSpot1 = ListItem("teamLab digital art", "Immersive light installations")
showSpot2 = ListItem("Sumo tournaments", "Six grand tournaments a year")
showSpot3 = ListItem("Baseball at Tokyo Dome", "Japan's loudest fan culture")
showsTags = TagBlock([uniqueTag, bookAheadTag])
uniqueTag = Tag("Only in Japan", "warning")
bookAheadTag = Tag("Book Ahead", "danger")`,
      },
      {
        id: "demo_travel_planner_user_2",
        role: "user",
        content: "Help me plan a trip.",
      },
      {
        id: "demo_travel_planner_assistant_2",
        role: "assistant",
        content: `root = Card([header, intro, planForm])
header = Header("Plan Your Trip to Japan", "Tell us your preferences and we'll craft the perfect itinerary")
intro = TextContent("Fill in the details below and we'll tailor a Japan travel plan just for you.")
planForm = Form("japan_trip_planner", formButtons, [departureField, datesField, durationField, travellersField, styleField, destinationsField])
formButtons = ButtonGroup([submitButton])
submitButton = Button("Create My Itinerary")
departureField = FormControl("Departure City", departureInput, "Where are you flying from?")
departureInput = Input("departure_city", {required: true}, "e.g. New York, London, Sydney", "text")
datesField = FormControl("Travel Dates", datesInput, "Select your preferred travel window")
datesInput = DatePicker("travel_dates", "range", {required: true})
durationField = FormControl("Trip Duration", durationInput, "How long is your trip?")
durationInput = Select("trip_duration", [durationA, durationB, durationC, durationD], {required: true}, "Select duration")
durationA = SelectItem("5-7", "5 to 7 days")
durationB = SelectItem("8-10", "8 to 10 days")
durationC = SelectItem("11-14", "11 to 14 days")
durationD = SelectItem("15plus", "15 days or more")
travellersField = FormControl("Number of Travellers", travellersInput, "How many people are travelling?")
travellersInput = Select("travellers", [soloItem, coupleItem, smallGroupItem, bigGroupItem], {required: true}, "Select number of travellers")
soloItem = SelectItem("1", "Just me")
coupleItem = SelectItem("2", "2 travellers")
smallGroupItem = SelectItem("3-4", "3 to 4 travellers")
bigGroupItem = SelectItem("5plus", "5 or more")
styleField = FormControl("Trip Style", styleInput, "What kind of experience are you looking for?")
styleInput = OptionCards("trip_style", "single", [culturalCard, natureCard, foodCard, cityCard, relaxCard, mixCard], {required: true})
culturalCard = OptionCard("cultural", "Cultural & Historical", "Temples, shrines & ancient traditions", culturalIcon)
culturalIcon = Icon("landmark")
natureCard = OptionCard("nature", "Nature & Outdoors", "Mountains, forests & scenic landscapes", natureIcon)
natureIcon = Icon("mountain")
foodCard = OptionCard("food", "Food & Culinary", "Ramen, sushi & local street food", foodIcon)
foodIcon = Icon("utensils")
cityCard = OptionCard("city", "City & Modern Japan", "Anime, tech, nightlife & fashion", cityIcon)
cityIcon = Icon("building-2")
relaxCard = OptionCard("relax", "Relaxation & Wellness", "Onsen ryokans & peaceful retreats", relaxIcon)
relaxIcon = Icon("bath")
mixCard = OptionCard("mix", "Mix of Everything", "A balanced all-round experience", mixIcon)
mixIcon = Icon("sparkles")
destinationsField = FormControl("Destinations of Interest", destinationsInput, "Select all the places you'd like to visit")
destinationsInput = Chips("destinations", "multiple", [tokyoChip, kyotoChip, osakaChip, hiroshimaChip, naraChip, hakoneChip, okinawaChip, sapporoChip])
tokyoChip = ChipItem("tokyo", "Tokyo", tokyoChipIcon)
tokyoChipIcon = Icon("zap")
kyotoChip = ChipItem("kyoto", "Kyoto", kyotoChipIcon)
kyotoChipIcon = Icon("landmark")
osakaChip = ChipItem("osaka", "Osaka", osakaChipIcon)
osakaChipIcon = Icon("utensils")
hiroshimaChip = ChipItem("hiroshima", "Hiroshima", hiroshimaChipIcon)
hiroshimaChipIcon = Icon("heart")
naraChip = ChipItem("nara", "Nara", naraChipIcon)
naraChipIcon = Icon("leaf")
hakoneChip = ChipItem("hakone", "Hakone", hakoneChipIcon)
hakoneChipIcon = Icon("thermometer")
okinawaChip = ChipItem("okinawa", "Okinawa", okinawaChipIcon)
okinawaChipIcon = Icon("waves")
sapporoChip = ChipItem("sapporo", "Sapporo", sapporoChipIcon)
sapporoChipIcon = Icon("snowflake")`,
      },
    ],
  },
  {
    id: "demo_blockbusters",
    slug: "blockbuster-report",
    title: "Blockbuster report",
    description: "The three highest-grossing films of all time, visualized",
    icon: "compare",
    sourcePrompt: "What are the top 3 highest-grossing movies of all time?",
    recordedModel: "anthropic/claude-sonnet-4.6",
    linkedArtifactId: BLOCKBUSTER_ARTIFACT.id,
    messages: [
      {
        id: "demo_blockbusters_user_1",
        role: "user",
        content: "What are the top 3 highest-grossing movies of all time?",
      },
      {
        id: "demo_blockbusters_assistant_1",
        role: "assistant",
        content: `root = Card([header, spotlightsHeader, filmCards, statCards, splitHeader, splitChart, franchiseChart, franchiseNote, sourcesLabel, sources])
franchiseChart = PieChart([{category: "Marvel Cinematic Universe", value: 31.9}, {category: "Star Wars", value: 10.3}, {category: "Wizarding World", value: 9.7}, {category: "James Bond", value: 7.9}, {category: "Avatar", value: 5.2}], "donut", "Franchise Comparison", "Total worldwide gross by film franchise, in USD billions", "")
franchiseNote = CalloutV2("info", "Avatar earns the most per film", "Two Avatar films have averaged about $2.6B each, the highest per-film gross of any franchise. The MCU leads on volume with 30+ releases.")
sourcesLabel = TextContent("Sources", "small-heavy")
sources = SnippetCardBlock([mojoSource, numbersSource, varietySource], "grid")
mojoSource = SnippetCardItem("src-mojo", ImageText("https://www.google.com/s2/favicons?domain=boxofficemojo.com&sz=64", "Box Office Mojo logo", "Box Office Mojo", "All Time Worldwide Box Office"))
numbersSource = SnippetCardItem("src-numbers", ImageText("https://www.google.com/s2/favicons?domain=the-numbers.com&sz=64", "The Numbers logo", "The Numbers", "Top Grossing Movies of All Time"))
varietySource = SnippetCardItem("src-variety", ImageText("https://www.google.com/s2/favicons?domain=variety.com&sz=64", "Variety logo", "Variety", "Avatar Retakes the All-Time Box Office Crown"))
header = Header("Top 3 Highest-Grossing Movies of All Time", "Worldwide Box Office · James Cameron dominates the #1 & #3 spots")
statCards = SnippetCardBlock([grossCard, cameronCard, intlCard, eraCard], "grid")
grossCard = SnippetCardItem("gross", IconText(grossIcon, "success", "md", "Combined Gross", "Top 3 films total"), BoldText("number", "$8.05B", "across 3 films", "text", "md"))
grossIcon = Icon("dollar-sign")
cameronCard = SnippetCardItem("cameron", IconText(cameronIcon, "info", "md", "James Cameron", "Director of #1 & #3"), BoldText("number", "2 of 3", "top spots held", "text", "md"))
cameronIcon = Icon("clapperboard")
intlCard = SnippetCardItem("intl", IconText(intlIcon, "neutral", "md", "Avg. International Share", "Foreign box office"), BoldText("number", "71%", "of total gross", "text", "md"))
intlIcon = Icon("globe")
eraCard = SnippetCardItem("era", IconText(eraIcon, "warning", "md", "Era Span", "Oldest to newest"), BoldText("number", "13 Years", "2009 to 2022", "text", "md"))
eraIcon = Icon("calendar")
splitHeader = InlineHeader("Domestic vs. International Breakdown", "How each film's gross splits between US and international markets")
splitChart = HorizontalBarChart(["Avatar (2009)", "Avengers: Endgame (2019)", "Avatar: Way of Water (2022)"], [{category: "Domestic (US)", values: [0.79, 0.86, 0.68]}, {category: "International", values: [2.13, 1.94, 1.65]}], "Revenue Split by Market", "Worldwide gross in USD billions", "Gross (USD Billions)", "Film", "B", "grouped")
spotlightsHeader = InlineHeader("Film Spotlights", "The three films that define modern event cinema")
filmCards = VisualCardBlock([avatarCard, endgameCard, wowCard], "grid")
avatarCard = VisualCardItem(avatarBody, "avatar", "${DEMO_IMAGES.posterAvatar}", avatarTag, "Avatar (2009) poster")
avatarBody = BoldText("text", "Avatar", "$2.92B · 2009", "text", "md")
avatarTag = Tag("#1 All-Time Record", "neutral")
endgameCard = VisualCardItem(endgameBody, "endgame", "${DEMO_IMAGES.posterEndgame}", endgameTag, "Avengers: Endgame (2019) poster")
endgameBody = BoldText("text", "Avengers: Endgame", "$2.80B · 2019", "text", "md")
endgameTag = Tag("#2 · MCU Peak", "neutral")
wowCard = VisualCardItem(wowBody, "wow", "${DEMO_IMAGES.posterWayOfWater}", wowTag, "Avatar: The Way of Water (2022) poster")
wowBody = BoldText("text", "Avatar: The Way of Water", "$2.33B · 2022", "text", "md")
wowTag = Tag("#3 · Most Expensive Ever", "neutral")`,
      },
      {
        id: "demo_blockbusters_user_2",
        role: "user",
        content: "Package this into a shareable slide deck.",
      },
      ...createArtifactTurn(
        "demo_blockbusters",
        BLOCKBUSTER_ARTIFACT,
        "I turned the box-office breakdown into a seven-slide deck covering the films, podium, global appeal, and the event-cinema playbook.",
      ),
    ],
  },
];

const DEMO_CONVERSATIONS_BY_ID = new Map(
  DEMO_CONVERSATIONS.map((conversation) => [conversation.id, conversation]),
);
const DEMO_CONVERSATIONS_BY_SLUG = new Map(
  DEMO_CONVERSATIONS.map((conversation) => [conversation.slug, conversation]),
);
const DEMO_ARTIFACTS_BY_ID = new Map(DEMO_ARTIFACTS.map((artifact) => [artifact.id, artifact]));

if (process.env.NODE_ENV !== "production") validateDemoContent();

export function getDemoConversation(id: string | null | undefined): DemoConversation | undefined {
  if (!id) return undefined;
  return DEMO_CONVERSATIONS_BY_ID.get(id as DemoConversation["id"]);
}

export function getDemoConversationBySlug(slug: string): DemoConversation | undefined {
  return DEMO_CONVERSATIONS_BY_SLUG.get(slug);
}

export function getDemoConversationPath(conversation: DemoConversation): string {
  return `/chat/demo/${conversation.slug}`;
}

export function getDemoArtifact(id: string): DemoArtifact | undefined {
  return DEMO_ARTIFACTS_BY_ID.get(id as DemoArtifact["id"]);
}

export function getDemoTurnCount(conversation: DemoConversation): number {
  return conversation.messages.filter((message) => message.role === "user").length;
}

export function getDemoFirstUserMessage(conversation: DemoConversation): UserMessage {
  const message = conversation.messages.find((candidate) => candidate.role === "user");
  if (!message || message.role !== "user") {
    throw new Error(`Demo conversation ${conversation.id} is missing its first user message.`);
  }
  return message;
}

export function cloneDemoMessages(conversation: DemoConversation): Message[] {
  return structuredClone(conversation.messages);
}

function validateDemoContent() {
  const artifactIds = new Set<string>();
  const conversationSlugs = new Set<string>();
  const counts: Record<DemoArtifactKind, number> = { report: 0, slides: 0 };

  for (const artifact of DEMO_ARTIFACTS) {
    if (artifactIds.has(artifact.id)) {
      throw new Error(`Duplicate demo artifact ID: ${artifact.id}`);
    }
    artifactIds.add(artifact.id);
    counts[artifact.type] += 1;
  }

  if (counts.report !== 4 || counts.slides !== 4) {
    throw new Error(
      `Expected four reports and four slide decks; found ${counts.report} reports and ${counts.slides} slide decks.`,
    );
  }

  const expectedLinks = new Map<DemoConversation["id"], DemoArtifact["id"]>([
    ["demo_stock_comparison", STOCK_ARTIFACT.id],
    ["demo_blockbusters", BLOCKBUSTER_ARTIFACT.id],
  ]);
  const linkedConversations = DEMO_CONVERSATIONS.filter(
    (conversation) => conversation.linkedArtifactId !== undefined,
  );

  if (linkedConversations.length !== expectedLinks.size) {
    throw new Error("Only Stock comparison and Blockbuster report may link thread artifacts.");
  }

  for (const conversation of DEMO_CONVERSATIONS) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(conversation.slug)) {
      throw new Error(`Invalid demo conversation slug: ${conversation.slug}`);
    }
    if (conversationSlugs.has(conversation.slug)) {
      throw new Error(`Duplicate demo conversation slug: ${conversation.slug}`);
    }
    conversationSlugs.add(conversation.slug);

    const expectedArtifactId = expectedLinks.get(conversation.id);
    if (conversation.linkedArtifactId !== expectedArtifactId) {
      throw new Error(`Unexpected demo artifact link for ${conversation.id}.`);
    }
    if (!expectedArtifactId) continue;

    const artifact = DEMO_ARTIFACTS_BY_ID.get(expectedArtifactId);
    if (!artifact || artifact.threadId !== conversation.id) {
      throw new Error(`Invalid demo artifact thread link for ${conversation.id}.`);
    }
    if (!JSON.stringify(conversation.messages).includes(expectedArtifactId)) {
      throw new Error(`Demo thread ${conversation.id} is missing its artifact turn.`);
    }
  }
}

function createDemoArtifact(artifact: Omit<DemoArtifact, "content">): DemoArtifact {
  const carrierHeader = JSON.stringify({
    artifact_id: artifact.id,
    type: artifact.type,
    name: artifact.title,
    version: "1",
  });

  return {
    ...artifact,
    content: `]]>openui:artifact ${carrierHeader}\n${artifact.program}`,
  };
}

function createArtifactTurn(idPrefix: string, artifact: DemoArtifact, summary: string): Message[] {
  const toolCallId = `${idPrefix}_artifact_call`;
  const toolName = artifact.type === "slides" ? "thesys_generate_slides" : "thesys_generate_report";
  const artifactLabel = artifact.type === "slides" ? "Presentation" : "Report";
  const toolArguments = JSON.stringify({
    artifact_id: artifact.id,
    artifact_type: artifact.type,
    type: artifact.type,
    name: artifact.title,
    version: "1",
    artifact_content: artifact.program,
  });
  const carrierHeader = JSON.stringify({
    artifact_id: artifact.id,
    type: artifact.type,
    name: artifact.title,
    version: "1",
  });

  return [
    {
      id: `${idPrefix}_artifact_assistant`,
      role: "assistant",
      content: `root = Card([ready, summary])
ready = CalloutV2("success", "${artifactLabel} ready", "Open the artifact to explore the complete, presentation-ready output.")
summary = TextContent(${JSON.stringify(summary)}, "small")`,
      toolCalls: [
        {
          id: toolCallId,
          type: "function",
          function: { name: toolName, arguments: toolArguments },
        },
      ],
    },
    {
      id: `${idPrefix}_artifact_tool`,
      role: "tool",
      toolCallId,
      content: `]]>openui:artifact ${carrierHeader}\n${artifact.program}`,
    },
  ];
}
