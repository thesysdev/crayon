// Requests the eval sends to each kit. `tools` lists the tools a good answer
// needs: each inner list is any-of, so [["a", "b"]] passes with either.

export interface EvalCase {
  kit: "ecommerce" | "analytics";
  id: string;
  prompt: string;
  tools: string[][];
}

export const CASES: EvalCase[] = [
  {
    kit: "ecommerce",
    id: "overview-why",
    prompt: "Give me this month's store overview: what changed and why?",
    tools: [["get_store_kpis"], ["get_store_insights"]],
  },
  {
    kit: "ecommerce",
    id: "week-why",
    prompt: "Sales are down this week. Why?",
    tools: [["get_store_kpis", "get_sales_over_time"], ["get_store_insights"]],
  },
  {
    kit: "ecommerce",
    id: "profit",
    prompt: "Did we actually make money this month after ads, shipping, and fees?",
    tools: [["get_profit_breakdown"]],
  },
  {
    kit: "ecommerce",
    id: "amazon-week",
    prompt:
      "Show only Amazon sales for the last 7 days: orders, average order value, and top products.",
    tools: [["get_store_kpis"], ["get_product_performance"]],
  },
  {
    kit: "ecommerce",
    id: "categories",
    prompt:
      "Compare footwear, apparel, accessories and home: which category is growing and which is shrinking?",
    tools: [["get_sales_by", "get_product_performance"]],
  },
  {
    kit: "ecommerce",
    id: "goal",
    prompt: "Are we on track for this month's sales goal? What do we need per day to hit it?",
    tools: [["get_sales_goal"]],
  },
  {
    kit: "ecommerce",
    id: "worst-channel",
    prompt:
      "Which marketing channel has the worst return on ad spend, and how much are we spending there?",
    tools: [["get_marketing_performance"]],
  },
  {
    kit: "ecommerce",
    id: "checkout-device",
    prompt: "Show me the checkout journey on mobile versus desktop: where do people drop off?",
    tools: [["get_checkout_journey", "get_purchase_journey"]],
  },
  {
    kit: "ecommerce",
    id: "restock",
    prompt:
      "Which products are close to running out, and how many days of stock do they have left?",
    tools: [["get_inventory_health"]],
  },
  {
    kit: "ecommerce",
    id: "standup",
    prompt: "Give me a one-screen summary for a Monday morning standup, last 7 days.",
    tools: [["get_store_kpis"]],
  },
  {
    kit: "ecommerce",
    id: "out-of-scope",
    prompt: "How did the weather affect our sales?",
    tools: [],
  },
  {
    kit: "ecommerce",
    id: "minimal",
    prompt: "Make it very simple: just 3 numbers for this month.",
    tools: [["get_store_kpis"]],
  },
  {
    kit: "analytics",
    id: "platform-retention",
    prompt: "Compare web, iOS, and Android: which platform retains users best?",
    tools: [["get_retention_curves", "get_retention_cohorts"]],
  },
  {
    kit: "analytics",
    id: "signup-quality",
    prompt: "Which signup sources bring users who actually stay?",
    tools: [["get_signups_by_source"]],
  },
  {
    kit: "analytics",
    id: "experiments",
    prompt: "Show all running experiments and whether any have a clear winner.",
    tools: [["get_experiments"]],
  },
  {
    kit: "analytics",
    id: "account-risk",
    prompt: "Which Business accounts are at risk of churning, and why?",
    tools: [["get_account_health"]],
  },
];
