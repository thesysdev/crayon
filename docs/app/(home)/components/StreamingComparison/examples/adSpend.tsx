import type { ComparisonExample } from "../types";

/* Charts: the Compare demo's ad spend question, as an essay of numbers versus
   KPI figures, a spend-vs-sales chart, a share donut and a trend. Sample data. */
export const AD_SPEND: ComparisonExample = {
  prompt: "Tell me about the correlation between our ad spends and sales",
  left: {
    label: "Without",
    follow: true,
    blocks: [
      { type: "heading", text: "Ad Spend vs Sales" },
      {
        type: "paragraph",
        text: "Across all regions in 2025 (YTD), total advertising spend reached $2.4B, driving $9.1B in sales revenue. The overall correlation between advertising spend and sales is strong (R² = 0.72). On average, every additional $1M in advertising spend generated $3.8M in sales.",
      },
      {
        type: "bullets",
        items: [
          "Average campaign spend: $4.2M",
          "Average campaign sales: $16.0M",
          "Top 5% campaigns: Achieved ROIs above 500%",
          "Bottom 5% campaigns: Returned ROIs below 120%",
        ],
      },
      { type: "subheading", text: "North America: Strong & Consistent" },
      {
        type: "paragraph",
        text: "North America's campaigns showed the tightest clustering, with 80% of campaigns delivering sales within ±15% of predicted values. The top outlier campaign spent $8M but brought in $48M in sales, a 6x return.",
      },
      {
        type: "bullets",
        items: [
          "Total spend: $1.05B",
          "Total sales: $4.7B",
          "R²: 0.81 (highest of all regions)",
          "Average ROI: 350%",
        ],
      },
      { type: "subheading", text: "Europe: Moderate but Stable" },
      {
        type: "paragraph",
        text: "European campaigns showed steady returns, though the slope was flatter compared to North America. Mid-spend campaigns ($3–5M) often outperformed both lower and higher spend brackets, indicating diminishing returns beyond the $7M spend range.",
      },
    ],
  },
  right: {
    label: "With OpenUI",
    blocks: [
      { type: "heading", text: "Ad Spend vs Sales" },
      {
        type: "muted",
        text: "Across all regions in 2025 (YTD), total advertising spend reached $4.42Mn",
      },
      {
        type: "metrics",
        layout: "rules",
        metrics: [
          { value: "$4.42Mn", change: "+4.8%", trend: "up", label: "Total spend" },
          { value: "$16.19Mn", change: "+10.7%", trend: "up", label: "Total sales" },
          { value: "501.8%", label: "Return on investment" },
        ],
      },
      {
        type: "groupedBars",
        title: "Spend vs sales by market",
        categories: [
          "USA",
          "CAN",
          "UK",
          "GER",
          "IND",
          "CHI",
          "JPN",
          "FRA",
          "SPN",
          "ITY",
          "BGN",
          "BRZ",
        ],
        min: 2,
        max: 10,
        suffix: "M",
        series: [
          {
            name: "Spends",
            color: "#93b4f8",
            values: [4.4, 4.9, 3.5, 4.5, 4.9, 3.4, 4.0, 3.5, 4.1, 3.6, 4.3, 4.1],
          },
          {
            name: "Sales",
            color: "#4f46e5",
            values: [6.9, 6.1, 5.3, 5.9, 7.6, 4.6, 5.5, 6.6, 5.5, 4.8, 8.4, 6.4],
          },
        ],
      },
      {
        type: "split",
        columns: [
          [
            {
              type: "donut",
              title: "Share of Global Spend",
              slices: [
                { label: "USA", value: 28, color: "#4f46e5" },
                { label: "India", value: 18, color: "#6d72f0" },
                { label: "Canada", value: 14, color: "#93b4f8" },
                { label: "Bulgaria", value: 12, color: "#c7d2fe" },
                { label: "Others", value: 28, color: "#e5e7eb" },
              ],
            },
          ],
          [
            {
              type: "area",
              title: "Sales over time",
              values: [5.2, 5.6, 5.4, 6.1, 6.0, 6.6, 7.1, 7.4, 7.9, 8.4, 8.2],
              labels: ["2015", "2020", "2025"],
            },
          ],
        ],
      },
    ],
  },
};
