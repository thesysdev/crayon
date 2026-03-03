"use client";

import BlocksDocPage from "@components/blocks/_components/BlocksDocPage";
import ClientOnly from "@components/blocks/_components/ClientOnly";
import { RadialChart } from "@openuidev/react-ui";

const radialData = [
  { month: "January", value: 1250 },
  { month: "February", value: 980 },
  { month: "March", value: 1450 },
  { month: "April", value: 1320 },
];

function RadialChartPreview() {
  return (
    <ClientOnly>
      <div style={{ width: "600px" }}>
        <RadialChart data={radialData} categoryKey="month" dataKey="value" variant="circular" />
      </div>
    </ClientOnly>
  );
}

export default function BlocksRadialChartPage() {
  return (
    <BlocksDocPage
      title="Radial chart"
      description="Preview for the Radial chart block."
      preview={<RadialChartPreview />}
    />
  );
}
