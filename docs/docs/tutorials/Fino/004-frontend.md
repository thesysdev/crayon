# Generative UI

## Creating a response template for breakdown_expense
Now that we have a response template, we need to create a component that will render it.

```tsx title="src/app/reponseTemplates/templates.tsx"
"use client";
import { Card, CardHeader } from "@crayonai/react-ui";
import { PieChart } from "@crayonai/react-ui/Charts/PieChart";
import { BreakdownExpensesSummaryProps } from "@/types/responseTemplates/templates";

export const BreakdownExpenses: React.FC<BreakdownExpensesSummaryProps> = ({
  expenses,
  total_spent: totalSpent,
}) => {
  const chartData = expenses.map((expense) => ({
    category: expense.category,
    amount: expense.amount,
  }));

  return (
    <Card className="items-center">
      <CardHeader title={`Breakdown of expenses, Total Spent: ${totalSpent}`} />
      <div className="w-[400px]">
        <PieChart data={chartData} categoryKey="category" dataKey="amount" />
      </div>
    </Card>
  );
};
```

## Passing response templates to CrayonChat
Lastly, we need to pass the response templates to the CrayonChat component so that it can render them.

```tsx title="src/app/page.tsx"
import { BreakdownExpenses } from "@/app/reponseTemplates/templates";

export default function Home() {
  return <CrayonChat processMessage={processMessage} templates={[{
    name: "breakdown_expenses",
    Component: BreakdownExpenses,
  }]} />;
}
```
