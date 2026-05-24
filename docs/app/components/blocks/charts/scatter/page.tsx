"use client";

import BlocksDocPage from "@components/blocks/_components/BlocksDocPage";
import ClientOnly from "@components/blocks/_components/ClientOnly";
import { ScatterChart } from "@openuidev/react-ui";

const scatterData = [
  {
    name: "A school",
    data: [
      { x: 100, y: 200, z: 200 },
      { x: 120, y: 100, z: 260 },
      { x: 170, y: 300, z: 400 },
    ],
  },
  {
    name: "B school",
    data: [
      { x: 200, y: 180, z: 240 },
      { x: 180, y: 350, z: 220 },
      { x: 160, y: 320, z: 250 },
    ],
  },
];

function ScatterChartPreview() {
  return (
    <ClientOnly>
      <div style={{ width: "600px" }}>
        <ScatterChart data={scatterData} xAxisDataKey="x" yAxisDataKey="y" />
      </div>
    </ClientOnly>
  );
}

export default function BlocksScatterChartPage() {
  return (
    <BlocksDocPage
      title="Scatter"
      description="Preview for the Scatter chart block."
      preview={<ScatterChartPreview />}
    />
  );
}
