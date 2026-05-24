"use client";

import BlocksDocPage from "@components/blocks/_components/BlocksDocPage";
import ClientOnly from "@components/blocks/_components/ClientOnly";
import { PieChart } from "@openuidev/react-ui";

const pieData = [
  { category: "January", value: 1250 },
  { category: "February", value: 980 },
  { category: "March", value: 1450 },
  { category: "April", value: 1320 },
  { category: "May", value: 1680 },
  { category: "June", value: 2100 },
];

function PieChartPreview() {
  return (
    <ClientOnly>
      <div style={{ width: "720px" }}>
        <PieChart
          data={pieData}
          categoryKey="category"
          dataKey="value"
          variant="pie"
          format="percentage"
          legend
          legendVariant="stacked"
          minChartSize={296}
          maxChartSize={296}
          customPalette={["#1f7ecc", "#2a8fdf", "#3f9ae6", "#5ca9ed", "#7cbbee", "#9ecdf2"]}
        />
      </div>
    </ClientOnly>
  );
}

export default function BlocksPieChartPage() {
  return (
    <BlocksDocPage
      title="Pie"
      description="Preview for the Pie chart block."
      preview={<PieChartPreview />}
    />
  );
}
