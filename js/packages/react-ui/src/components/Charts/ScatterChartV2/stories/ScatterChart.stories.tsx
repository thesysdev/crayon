import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { ScatterChartV2 } from "../ScatterChartV2";
import { ScatterChartData } from "../types";

const meta: Meta<typeof ScatterChartV2> = {
  title: "Components/Charts/ScatterChartV2",
  component: ScatterChartV2,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const multipleDatasets: ScatterChartData = [
  {
    name: "Revenue",
    data: [
      { x: 1000, y: 1200 },
      { x: 1200, y: 1400 },
      { x: 1700, y: 2100 },
      { x: 1400, y: 1800 },
      { x: 1500, y: 1950 },
      { x: 1100, y: 1300 },
      { x: 2000, y: 2500 },
      { x: 1800, y: 2200 },
      { x: 1600, y: 1850 },
      { x: 1900, y: 2350 },
      { x: 1300, y: 1600 },
      { x: 2200, y: 2800 },
    ],
  },
  {
    name: "Profit",
    data: [
      { x: 1000, y: 200 },
      { x: 1200, y: 280 },
      { x: 1700, y: 420 },
      { x: 1400, y: 350 },
      { x: 1500, y: 380 },
      { x: 1100, y: 240 },
      { x: 2000, y: 500 },
      { x: 1800, y: 450 },
      { x: 1600, y: 390 },
      { x: 1900, y: 470 },
      { x: 1300, y: 320 },
      { x: 2200, y: 580 },
    ],
  },
];

export const ScatterChartV2Example: Story = {
  name: "🔧 Direct Recharts Example",
  render: (args) => (
    <Card style={{ width: "700px" }}>
      <ScatterChartV2 {...args} data={multipleDatasets} height={450} />
    </Card>
  ),
  args: {
    data: multipleDatasets,
  },
};
