export const STOCK_REPORT_PROGRAM = String.raw`
root = ReportView("Big Tech 2025 Report Card", "Meta, Microsoft, Netflix, and Google versus the S&P 500", pages)
pages = [p1, p2, p3, p4, p5, p6, p7, p8, p9]

coverImg = "https://www.bostonherald.com/wp-content/uploads/2025/12/Financial_Markets_Wall_Street_37501.jpg"
coverBody = TextContent("An executive comparison of four technology and media leaders, the forces behind their 2025 returns, and the signals that could shape their relative position in 2026.\n\nFull-year price return review · Data as of Dec. 31, 2025\n\nFor demonstration only · Not investment advice · Returns are price returns unless stated")
coverContent = StandardFrontPage("Big Tech 2025 Report Card", coverImg, coverBody, "Meta, Microsoft, Netflix, and Google versus the S&P 500", "title-top")
p1 = Page("cover", coverContent)

p2Header = InlineHeader("The Year in One View", "Google dominated. Microsoft roughly matched the index. Meta and Netflix trailed the benchmark.")
p2Metrics = KeyMetrics("row", [
  { "title": "+65%", "text": "Alphabet 2025 Price Return" },
  { "title": "+16%", "text": "S&P 500 Price Return (Benchmark)" },
  { "title": "+14.5%", "text": "Microsoft 2025 Price Return" },
  { "title": "+10%", "text": "Meta 2025 Price Return" },
  { "title": "+5%", "text": "Netflix 2025 Price Return" }
])
p2Statement = HeadlineStatement("Only Google decisively beat the benchmark", "On a verified price-return basis, Alphabet gained approximately 65% — roughly 49 percentage points above the S&P 500's 16% price return. Microsoft and Meta roughly tracked the index on a price basis, while Netflix lagged materially at approximately 5%. Total returns (with dividends reinvested) shift Microsoft marginally positive versus the benchmark. Note: Illustrative figures circulating in research decks (GOOGL +66%, MSFT +21%, NFLX +14%, META +9%) are rounded estimates; the verified price return data used here derives from market close prices.", "default")
p2Points = NumberedKeyPoint("column", [
  { "title": "Performance Leader", "body": "Google captured the strongest combination of AI enthusiasm, Cloud momentum, and earnings expectations, finishing best year since 2009." },
  { "title": "Near-Benchmark Performer", "body": "Microsoft's Azure and Copilot narrative supported a return close to the index on a price-return basis; total return including dividends places it marginally ahead." },
  { "title": "Operational Strength vs. Returns", "body": "Netflix expanded revenue +16% and margin to 29.5% yet delivered a price return of approximately 5% — well below the benchmark." }
])
p2Content = ContentPage([p2Header, p2Metrics, p2Statement, p2Points])
p2 = Page("executive-scoreboard", p2Content)

p3Header = InlineHeader("2025 Price Returns versus the Benchmark", "Full-year price return for each company compared with the S&P 500 (Jan 2–Dec 31, 2025). SPY ETF used as investable benchmark proxy.")
p3ChartData = {
  "data": {
    "labels": ["Alphabet (GOOGL)", "S&P 500 (Benchmark)", "Microsoft (MSFT)", "Meta (META)", "Netflix (NFLX)"],
    "series": [
      { "category": "Price Return (%)", "values": [65, 16, 14.5, 10, 5] }
    ]
  }
}
p3Chart = BarChartV2(p3ChartData, "grouped", true, "2025 Price Return (%)", "Company / Index")
p3Annotations = SummaryGrid([
  { "type": "cyan", "label": "Alphabet (GOOGL)", "description": "+49 pts vs. benchmark" },
  { "type": "gray", "label": "Microsoft (MSFT)", "description": "−1.5 pts (price); +0.4 pts total return" },
  { "type": "gray", "label": "Meta (META)", "description": "−6 pts vs. benchmark" },
  { "type": "gray", "label": "Netflix (NFLX)", "description": "−11 pts vs. benchmark" }
])
p3Statement = KeyStatement("The performance spread was unusually wide: 60 percentage points separated Alphabet from Netflix. Google delivered its best annual return since 2009.")
p3Methodology = TextContent("Methodology Note: Price returns calculated Jan 2 open to Dec 31 close. SPY total return 2025: +17.7%. Total-return basis shifts Microsoft marginally above the benchmark. Sources: StatMuse Money, averageannualreturn.com, CNBC, SlickCharts, SPY Yahoo Finance.")
p3Content = ContentPage([p3Header, p3Chart, p3Annotations, p3Statement, p3Methodology])
p3 = Page("full-year-returns", p3Content)

p4Header = InlineHeader("The Path Mattered as Much as the Destination", "Key turning points in each company's 2025 trajectory.")
p4Col1 = Column("Quarter", "text")
p4Col2 = Column("Key Event", "text")
p4Col3 = Column("Market Reaction", "text")
p4Col4 = Column("Cumulative Leaders", "text")
p4Table = Table([p4Col1, p4Col2, p4Col3, p4Col4], [
  ["Q1 2025", "Trump tariff shock; S&P 500 dropped ~16% from peak; GOOGL hit year low in April", "Broad tech sell-off; all five names declined", "All negative from start of year"],
  ["Q2 2025", "Tariff pause and trade deals; AI earnings beats; Gemini momentum builds", "GOOGL begins strong recovery, up >100% from April low by year-end", "GOOGL breaks out"],
  ["Q3 2025", "Netflix Q2 earnings: 325M members crossed; Meta ad revenue solid", "NFLX and META stabilize; MSFT steady on Azure growth", "GOOGL, MSFT near benchmark"],
  ["Q4 2025", "GOOGL Q3 AI-led earnings beat; Netflix WBD acquisition announced Dec 5", "GOOGL surges to +65% for year; NFLX and META lag", "GOOGL clear leader"]
])
p4Narrative = TextContent("Google's outperformance was concentrated in H2 after AI product announcements and strong Cloud earnings drove a rerating. Netflix's strong operating results in late 2025 — revenue $45.2B, margin 29.5% — did not translate into benchmark-beating stock performance. Microsoft tracked close to the index throughout the year. Meta recovered from the tariff lows but finished below the benchmark.\n\nNote: A full monthly return chart would require verified adjusted-close price series for all five instruments. Readers are directed to Bloomberg, Refinitiv, or Yahoo Finance for verified monthly data.")
p4Content = ContentPage([p4Header, p4Table, p4Narrative])
p4 = Page("performance-evolution", p4Content)

p5Header = InlineHeader("Four Companies, Four Different Return Stories", "Price return, benchmark spread, sector, and principal 2025 driver. Returns are price returns, Jan 2–Dec 31, 2025.")
p5Col1 = Column("Company", "text")
p5Col2 = Column("Ticker", "text")
p5Col3 = Column("2025 Price Return", "number")
p5Col4 = Column("Spread vs. S&P 500", "text")
p5Col5 = Column("Sector", "text")
p5Col6 = Column("Principal Driver", "text")
p5Col7 = Column("Outcome", "text")

p5TagOutperformed = TagBlock([{ "text": "Outperformed", "variant": "success" }])
p5TagNear = TagBlock([{ "text": "Near-benchmark", "variant": "neutral" }])
p5TagUnder1 = TagBlock([{ "text": "Underperformed", "variant": "warning" }])
p5TagUnder2 = TagBlock([{ "text": "Underperformed", "variant": "warning" }])

p5Table = Table([p5Col1, p5Col2, p5Col3, p5Col4, p5Col5, p5Col6, p5Col7], [
  ["Alphabet", "GOOGL", "+65%", "+49 pts", "Communication Services", "Gemini AI + Google Cloud", p5TagOutperformed],
  ["Microsoft", "MSFT", "+14.5%", "−1.5 pts (price); +0.4 pts total", "Technology", "Azure + Copilot adoption", p5TagNear],
  ["Meta Platforms", "META", "+10%", "−6 pts", "Communication Services", "AI-powered advertising", p5TagUnder1],
  ["Netflix", "NFLX", "+5%", "−11 pts", "Communication Services", "Advertising tier + pricing", p5TagUnder2]
])
p5Takeaway = TextContent("The market rewarded visible AI and Cloud monetization far more strongly than advertising improvements, content momentum, or subscriber economics. Alphabet's 65% gain reflects genuine investor re-rating of its AI product suite and Cloud trajectory.")
p5Content = ContentPage([p5Header, p5Table, p5Takeaway])
p5 = Page("company-scorecards", p5Content)

p6Header = InlineHeader("What Drove the Performance Spread", "Each company entered 2025 with a different earnings narrative and investor expectation level.")
p6Cards = VisualCards([
  {
    "title": "Google: AI and Cloud Re-rating (+65%)",
    "body": "Gemini AI adoption, Cloud acceleration, and search resilience produced a 65% gain — its best year since 2009 — driven by a H2 surge.",
    "imageSrc": "https://media.gettyimages.com/id/2259952847/photo/mountain-view-california-the-google-logo-is-displayed-on-a-building-at-google-headquarters-on.jpg?s=612x612&w=gi&k=20&c=__iNp8om936I1ZsY6XYoffwztAubslSOlNa3IQkT60w="
  },
  {
    "title": "Microsoft: Steady AI Monetization (+14.5%)",
    "body": "Azure cloud growth and enterprise Copilot adoption kept Microsoft close to the index. Total return (+16.4%) sat marginally above the benchmark.",
    "imageSrc": "https://aufaittechnologies.com/wp-content/uploads/2025/07/MICROSOFT-COPILOT-1.jpg"
  },
  {
    "title": "Netflix: Stronger Business, Softer Stock (+5%)",
    "body": "Revenue grew 16% to $45.2B and margin expanded to 29.5%. Ad revenue surged >2.5x to >$1.5B, yet valuation and M&A noise weighed on returns.",
    "imageSrc": "https://cdn.prod.website-files.com/6724d53a912f28c1861d34c5/692ebf0330edb0279b3ebca5_Netflix%20Advertising_%20The%20Future%20of%20Streaming%20TV%20Ads%20and%20How%20to%20Use%20It%20for%20Marketing.webp"
  },
  {
    "title": "Meta: Ad Strength vs. Capex Intensity (+10%)",
    "body": "AI advertising drove solid engagement, but very large capital expenditure commitments for AI infrastructure created near-term return concerns.",
    "imageSrc": "https://engineering.fb.com/wp-content/uploads/2024/03/Meta-24K-GenAi-Clusters-hero.png"
  }
])
p6Content = ContentPage([p6Header, p6Cards])
p6 = Page("performance-drivers", p6Content)

p7Header = InlineHeader("Netflix Deep Dive: Financial Engine", "Operating momentum strengthened even as the stock trailed the benchmark.")
p7Metrics = KeyMetrics("row", [
  { "title": "$45.2B", "text": "Revenue FY2025 (+16% YoY)" },
  { "title": "29.5%", "text": "Operating Margin (+3 pts YoY)" },
  { "title": ">$1.5B", "text": "Ad Revenue FY2025 (>2.5x YoY)" },
  { "title": "325M+", "text": "Paid Memberships (Q4 Milestone)" },
  { "title": "$11.0B", "text": "Net Income FY2025 (+26% YoY)" },
  { "title": "~+5%", "text": "2025 Price Return (vs. S&P 500 +16%)" }
])
p7Statement = HeadlineStatement("Netflix's operating story was materially stronger than its relative stock performance", "Pricing, advertising, content engagement, and margin expansion all improved in 2025. Revenue grew 16% to $45.2B and operating margin reached 29.5% — the highest in company history. The stock nevertheless returned approximately 5% — roughly 11 percentage points behind the S&P 500 price return — indicating that valuation levels, strategic uncertainty, and the December 2025 Warner Bros. acquisition announcement (which Netflix subsequently walked away from in February 2026) may have weighed on the share price.", "default")

p7Col1 = Column("Metric", "text")
p7Col2 = Column("FY 2024", "text")
p7Col3 = Column("FY 2025", "text")
p7Col4 = Column("YoY Change", "text")
p7Table = Table([p7Col1, p7Col2, p7Col3, p7Col4], [
  ["Revenue", "$38.9B", "$45.2B", "+16%"],
  ["Operating Income", "~$7.0B (est.)", "~$13.3B", "+30% (FY est.)"],
  ["Operating Margin", "26.7%", "29.5%", "+2.8 pts"],
  ["Net Income", "$8.7B", "$11.0B", "+26%"],
  ["Ad Revenue", "~$0.6B (est.)", ">$1.5B", ">2.5x"],
  ["Paid Memberships", "~301M (est.)", "325M+", "~8% growth"]
])
p7Footnote = TextContent("Footnote: FY2024 operating income and ad revenue are estimates; Netflix does not separately report all line items annually. Sources: Netflix Q4 2025 Shareholder Letter (Jan 20, 2026); Netflix 10-K (Dec 31, 2025).")
p7Content = ContentPage([p7Header, p7Metrics, p7Statement, p7Table, p7Footnote])
p7 = Page("netflix-financials", p7Content)

p8Header = InlineHeader("Netflix: What Could Sustain — or Weaken — the Story", "The growth opportunity is broad, but execution complexity is increasing.")
p8Drivers = VisualCards([
  {
    "title": "Pricing Power",
    "body": "Higher average revenue per membership and selective price increases across markets. Balancing monetization against membership churn remains key.",
    "imageSrc": "https://www.munro.agency/wp-content/uploads/2025/06/Does-Netflix-Have-Ads-banner-1.jpg"
  },
  {
    "title": "Advertising Momentum",
    "body": "Ad revenue surpassed $1.5B (>2.5x YoY). First-party ad technology build-out aims to double ad revenue again in 2026.",
    "imageSrc": "https://cdn.prod.website-files.com/6724d53a912f28c1861d34c5/6a4e1c17e3bf6b88ced9af17_netflix%20ad%20business%20momentum.webp"
  },
  {
    "title": "Content & Live Events",
    "body": "Returning franchise series and live events drove a 9% rise in original viewing hours. Live sports and entertainment scale acquisition in 2026.",
    "imageSrc": "https://static-www.adweek.com/wp-content/uploads/2024/08/netflix-upfront-squidgame.jpeg?w=1200"
  }
])

p8RiskCol1 = Column("Risk", "text")
p8RiskCol2 = Column("Why It Matters", "text")
p8RiskCol3 = Column("Evidence to Monitor", "text")
p8RisksTable = Table([p8RiskCol1, p8RiskCol2, p8RiskCol3], [
  ["Streaming Competition", "Disney+, Amazon Prime, Apple TV+ and Max compete for wallet share", "Subscriber churn rates; content spending trends"],
  ["Valuation Expectations", "NFLX trades at a premium; strong operating results did not prevent 2025 underperformance", "Forward P/E vs. earnings growth; analyst target revisions"],
  ["Content Economics", "Rising production costs and talent fees compress margins", "Content amortization rates; operating margin guidance"],
  ["Advertising Execution", "Ad-tech build-out requires investment before scale returns materialize", "Ad revenue growth rate; CPM trends; ad-tier membership mix"],
  ["Pricing-Related Churn", "Repeated price increases may eventually accelerate cancellations", "Net membership adds by quarter; churn disclosure"],
  ["Warner Bros. Acquisition", "Announced WBD acquisition in Dec 2025; walked away in Feb 2026 (Paramount acquired). Deal did NOT close.", "Monitor future M&A capital allocation strategy"]
])
p8Summary = KeyStatement("Netflix's central challenge is converting a broader entertainment platform — spanning streaming, advertising, live events, and gaming — into durable per-member economics without sacrificing engagement quality or operating discipline.")
p8Content = ContentPage([p8Header, p8Drivers, p8RisksTable, p8Summary])
p8 = Page("netflix-drivers-risks", p8Content)

p9Header = InlineHeader("What to Watch Next", "The 2026 comparison will depend on monetization discipline, capital allocation, and the durability of AI-led earnings growth.")
p9Watchlist = NumberedKeyPoint("column", [
  { "title": "Google AI Monetization", "body": "Gemini usage trends, Google Cloud growth rate, and search advertising economics will determine whether the 2025 re-rating proves durable or mean-reverts." },
  { "title": "Microsoft Copilot Economics", "body": "Paid enterprise adoption, Azure acceleration, and the return on AI infrastructure investment are the key variables for Microsoft's benchmark-relative performance." },
  { "title": "Meta Capital Intensity", "body": "Very large AI infrastructure capex commitments create execution risk. The critical question: does spending produce proportional revenue and earnings growth?" },
  { "title": "Netflix Advertising & Engagement", "body": "Ad-tier economics, pricing strategy, churn management, and the performance of major content franchises will drive whether Netflix closes the gap to the benchmark." },
  { "title": "Benchmark-Relative Returns", "body": "All four companies underperformed or roughly matched the S&P 500 on a verified 2025 price-return basis except Alphabet. Sustained outperformance requires measurable earnings growth beyond AI narrative." }
])
p9Statement = HeadlineStatement("Google won 2025, but the next leadership position is not guaranteed", "Verified price returns show a clear performance hierarchy: Alphabet far ahead (+65%), Microsoft and the S&P 500 closely matched (~14.5% vs. ~16%), and Netflix and Meta below the benchmark. The 2026 outcome will depend less on AI or streaming narratives alone and more on measurable monetization, disciplined investment, and durable earnings growth. For all four companies, 2025 demonstrated that operational progress is necessary — but not sufficient — for market outperformance.", "default")
p9Sources = TextContent("Sources & References:\n- Netflix Q4 2025 Shareholder Letter, Netflix Investor Relations (January 20, 2026)\n- Netflix 10-K Annual Report FY2025, SEC EDGAR (January 2026)\n- \"Google stock wraps best year since 2009,\" CNBC (December 31, 2025)\n- StatMuse Money — GOOGL, MSFT, NFLX price returns 2025\n- averageannualreturn.com — META, GOOG total return 2025\n- SlickCharts — MSFT, NFLX, META annual returns\n- S&P 500 2025 Return, DQYDJ (December 31, 2025)\n- SPY Performance History, Yahoo Finance / State Street\n- Netflix and Warner Bros. Discovery acquisition announcement (December 5, 2025) / Reuters WBD updates (February 2026)\n\nFor demonstration only. Figures are based on publicly available market data and company disclosures and are not verified investment research or investment advice. Price returns calculated Jan 2 open to Dec 31 close unless stated. Dividends not included in price returns.")
p9Content = ContentPage([p9Header, p9Watchlist, p9Statement, p9Sources])
p9 = Page("conclusions-watchlist", p9Content)
`;
