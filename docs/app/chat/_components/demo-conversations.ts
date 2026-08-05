import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import type { Artifact, Message, UserMessage } from "@openuidev/react-headless";

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
  title: string;
  description: string;
  icon: DemoConversationIcon;
  sourcePrompt: string;
  recordedModel: string;
  artifact: DemoArtifact;
  messages: Message[];
}

const STOCK_REPORT_PROGRAM = `root = ReportView("Big Tech 2025 Report Card", "Meta, Microsoft, Netflix, and Google vs. the S&P 500 · Data as of Dec 31, 2025", [cover, summary, performance, watchlist])
cover = Page("cover", MinimalFrontPage("Big Tech 2025 Report Card", coverCopy, "Full-year 2025 review", "title-bottom"))
coverCopy = TextContent("How Meta, Microsoft, Netflix, and Google performed against the S&P 500 in 2025, and the themes that drove each result. For demonstration, not investment advice.")
summary = Page("summary", ContentPage([summaryHeader, metrics, summaryStatement]))
summaryHeader = InlineHeader("The year in one view", "One clear leader, two steady compounders, and one reset.")
metrics = KeyMetrics("row", [{title: "GOOGL", text: "+66%"}, {title: "MSFT", text: "+21%"}, {title: "NFLX", text: "+14%"}, {title: "META", text: "+9%"}])
summaryStatement = HeadlineStatement("Alphabet set the pace in 2025", "Gemini adoption and Cloud growth powered the group's standout return, while Microsoft compounded steadily and Meta's heavy AI capex kept its stock close to the index.", "default")
performance = Page("performance", ContentPage([perfHeader, ytdChart]))
perfHeader = InlineHeader("Full-year returns vs. the benchmark", "Final 2025 total return for each stock, in percent.")
ytdChart = BarChartV2({data: {labels: ["META", "MSFT", "NFLX", "GOOGL", "S&P 500"], series: [{category: "2025 return", values: [9, 21, 14, 66, 17]}]}, unit: "%"}, "Stock", "Return")
watchlist = Page("watchlist", ContentPage([watchHeader, watchPoints]))
watchHeader = InlineHeader("What to watch in 2026", "Three signals that would change the picture.")
watchPoints = NumberedKeyPoint("column", [{title: "AI capex payoff", body: "Meta and Google are spending record amounts on infrastructure. Watch whether revenue growth keeps pace with depreciation."}, {title: "Copilot monetization", body: "Microsoft's next leg depends on turning Copilot seats into durable per-user revenue."}, {title: "Streaming engagement", body: "Netflix needs the ads tier and live events to reignite growth after a cooling second half."}])`;

const TRAVEL_DECK_PROGRAM = `root = SlideShow("Must-See Japan", "A first-timer's highlight tour", [cover, why, route, cities, tips, closing])
cover = Slide("cover", StandardTitle("Must-See Japan", "Cities, temples, mountains, and food", "A first-timer's highlight tour"))
why = Slide("why", KeyInfoWithTitle("Why Japan", [{title: "Contrast", description: "Neon cities and quiet shrines within the same afternoon."}, {title: "Ease", description: "World-class rail makes multi-city trips simple."}, {title: "Food", description: "From street takoyaki to omakase counters."}], "horizontal-grid"))
route = Slide("route", TextBody("The classic route", ["Days 1 to 3 · Tokyo", "Day 4 · Hakone and Mount Fuji views", "Days 5 to 7 · Kyoto with a Nara day trip", "Day 8 · Osaka food crawl"], "title-left"))
cities = Slide("cities", ContentClassic("Where to base yourself", ["Tokyo for energy, tech, and nightlife", "Kyoto for temples, gardens, and ryokan stays", "Osaka for food and easy Kansai day trips"], "title-left"))
tips = Slide("tips", HeroMetric("7 to 10 days", "The sweet spot for a first Japan trip covering Tokyo, Kyoto, and Osaka", "horizontal"))
closing = Slide("closing", HeadlineStatement("Recommendation", "Fly into Tokyo, out of Osaka, and let the rail pass do the rest.", "title-bottom"))`;

const BLOCKBUSTER_REPORT_PROGRAM = `root = ReportView("Blockbuster Report", "The three highest-grossing films of all time · Worldwide box office", [cover, summary, breakdown, takeaways])
cover = Page("cover", MinimalFrontPage("Blockbuster Report", coverCopy, "All-time worldwide box office", "title-bottom"))
coverCopy = TextContent("How Avatar, Avengers: Endgame, and Avatar: The Way of Water earned a combined $8.05B, and what their runs reveal about global moviegoing.")
summary = Page("summary", ContentPage([summaryHeader, metrics, summaryStatement]))
summaryHeader = InlineHeader("The podium", "Two James Cameron films bookend the all-time list.")
metrics = KeyMetrics("row", [{title: "Avatar", text: "$2.92B"}, {title: "Endgame", text: "$2.80B"}, {title: "Way of Water", text: "$2.33B"}, {title: "Combined", text: "$8.05B"}])
summaryStatement = HeadlineStatement("Event cinema still rules", "Thirteen years separate the oldest and newest films on the podium, yet all three won the same way: global releases that made the theater the event.", "default")
breakdown = Page("breakdown", ContentPage([breakdownHeader, splitChart]))
breakdownHeader = InlineHeader("Where the money came from", "Domestic vs. international gross in USD billions.")
splitChart = BarChartV2({data: {labels: ["Avatar", "Endgame", "Way of Water"], series: [{category: "Domestic (US)", values: [0.79, 0.86, 0.68]}, {category: "International", values: [2.13, 1.94, 1.65]}]}, unit: "B"}, "Film", "Gross")
takeaways = Page("takeaways", ContentPage([takeawaysHeader, takeawaysPoints]))
takeawaysHeader = InlineHeader("Three takeaways", "What the all-time list rewards.")
takeawaysPoints = NumberedKeyPoint("column", [{title: "International pull", body: "Roughly seven of every ten dollars came from outside the US across the top three."}, {title: "Rereleases compound", body: "Avatar reclaimed the record after a 2021 China rerelease pushed it past Endgame."}, {title: "Spectacle premium", body: "All three sold the big screen itself: 3D, IMAX, and effects that demand a theater."}])`;

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
  threadId: "demo_travel_planner",
  updatedAt: "2026-06-28T12:00:00.000Z",
  program: TRAVEL_DECK_PROGRAM,
});

const BLOCKBUSTER_ARTIFACT = createDemoArtifact({
  id: "demo_artifact_blockbuster_report",
  title: "Blockbuster Report",
  type: "report",
  threadId: "demo_blockbusters",
  updatedAt: "2026-06-26T12:00:00.000Z",
  program: BLOCKBUSTER_REPORT_PROGRAM,
});

export const DEMO_CONVERSATIONS: readonly DemoConversation[] = [
  {
    id: "demo_stock_comparison",
    title: "Stock comparison",
    description: "Meta, Microsoft, Netflix, and Google versus the S&P 500 in 2025",
    icon: "analytics",
    sourcePrompt:
      "Compare Meta, Microsoft, Netflix, and Google for 2025. How did they do against the S&P 500?",
    recordedModel: DEFAULT_MODEL,
    artifact: STOCK_ARTIFACT,
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
        "I turned the four-stock comparison into a four-page report covering returns, drivers, and what to watch in 2026.",
      ),
    ],
  },
  {
    id: "demo_travel_planner",
    title: "Japan travel guide",
    description: "Must-see places in Japan with photos, highlights, and tips",
    icon: "travel",
    sourcePrompt: "Suggest must-see places in Japan.",
    recordedModel: DEFAULT_MODEL,
    artifact: TRAVEL_ARTIFACT,
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
    title: "Blockbuster report",
    description: "The three highest-grossing films of all time, visualized",
    icon: "compare",
    sourcePrompt: "What are the top 3 highest-grossing movies of all time?",
    recordedModel: DEFAULT_MODEL,
    artifact: BLOCKBUSTER_ARTIFACT,
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
avatarCard = VisualCardItem(avatarBody, "avatar", "https://media.snl.no/media/55860/standard_24150166553_ffc44a2cec_o.jpg", avatarTag, "Avatar film artwork")
avatarBody = BoldText("text", "Avatar", "$2.92B · 2009", "text", "md")
avatarTag = Tag("#1 All-Time Record", "neutral")
endgameCard = VisualCardItem(endgameBody, "endgame", "https://source.roboflow.com/YoxtNZPyyIPc3gHirQr71WOBORJ2/5ZMROjXhgtot7B1Fgjud/original.jpg", endgameTag, "Avengers: Endgame artwork")
endgameBody = BoldText("text", "Avengers: Endgame", "$2.80B · 2019", "text", "md")
endgameTag = Tag("#2 · MCU Peak", "neutral")
wowCard = VisualCardItem(wowBody, "wow", "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/d96bb958-4e6c-4ce0-9447-fbe226fbbecf/dfk66m9-e2a63b7d-a175-40d4-b80a-8d8a2e5fc082.jpg/v1/fill/w_1192,h_670,q_70,strp/avatar_2_the_way_of_water_animated_wallpaper_by_favorisxp_dfk66m9-pre.jpg", wowTag, "Avatar: The Way of Water artwork")
wowBody = BoldText("text", "Avatar: The Way of Water", "$2.33B · 2022", "text", "md")
wowTag = Tag("#3 · Most Expensive Ever", "neutral")`,
      },
      {
        id: "demo_blockbusters_user_2",
        role: "user",
        content: "Package this into a shareable report.",
      },
      ...createArtifactTurn(
        "demo_blockbusters",
        BLOCKBUSTER_ARTIFACT,
        "I turned the box-office breakdown into a four-page report covering the podium, the market split, and three takeaways.",
      ),
    ],
  },
];

export const DEMO_ARTIFACTS: readonly DemoArtifact[] = DEMO_CONVERSATIONS.map(
  (conversation) => conversation.artifact,
);

const DEMO_CONVERSATIONS_BY_ID = new Map(
  DEMO_CONVERSATIONS.map((conversation) => [conversation.id, conversation]),
);
const DEMO_ARTIFACTS_BY_ID = new Map(DEMO_ARTIFACTS.map((artifact) => [artifact.id, artifact]));

export function getDemoConversation(id: string | null | undefined): DemoConversation | undefined {
  if (!id) return undefined;
  return DEMO_CONVERSATIONS_BY_ID.get(id as DemoConversation["id"]);
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

function createDemoArtifact(artifact: Omit<DemoArtifact, "content">): DemoArtifact {
  return {
    ...artifact,
    content: JSON.stringify({
      artifact_id: artifact.id,
      type: artifact.type,
      name: artifact.title,
      version: "1",
      content: artifact.program,
    }),
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
