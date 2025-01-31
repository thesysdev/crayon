import type { Meta, StoryObj } from "@storybook/react";
import { Download, Monitor, TabletSmartphone, TrendingUp } from "lucide-react";
import "../charts.scss";

import { Button } from "../../Button";
import { Card } from "../../Card";
import { Footer } from "../../Footer/Footer";
import { Header } from "../../Header";
import { IconButton } from "../../IconButton";
import { AreaChart } from "../AreaChart";
import { BarChart } from "../BarChart";
import { LineChart } from "../LineChart";
import { RaderChart } from "../RaderChart";
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const areaChartData = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
  { month: "April", desktop: 180, mobile: 160 },
  { month: "May", desktop: 250, mobile: 120 },
  { month: "June", desktop: 300, mobile: 180 },
];

const lineChartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const radarChartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
} as const;

const BarChartComponent = () => {
  return (
    <Card style={{ width: "500px" }}>
      <Header
        actions={[
          <IconButton variant="tertiary" key="download-btn" size="small" icon={<TrendingUp />} />,
        ]}
        title="Bar Chart - Multiple"
        subtitle="January - June 2024"
      />
      <BarChart
        data={chartData}
        categoryKey="month"
        theme="sunset"
        icons={icons}
        variant="stacked"
      />
      <Footer>
        <Button iconRight={<Download />}>Download</Button>
      </Footer>
    </Card>
  );
};

const AreaChartComponent = () => {
  return (
    <Card style={{ width: "500px" }}>
      <Header
        actions={[
          <IconButton variant="tertiary" key="download-btn" size="small" icon={<TrendingUp />} />,
        ]}
        title="Area Chart - Multiple"
        subtitle="January - June 2024"
      />
      <AreaChart
        data={areaChartData}
        categoryKey="month"
        theme="ocean"
        icons={icons}
        variant="linear"
        width={460}
        height={300}
        opacity={1}
      />
      <Footer>
        <Button iconRight={<Download />}>Download</Button>
      </Footer>
    </Card>
  );
};

const LineChartComponent = () => {
  return (
    <Card style={{ width: "500px" }}>
      <Header
        actions={[
          <IconButton variant="tertiary" key="download-btn" size="small" icon={<TrendingUp />} />,
        ]}
        title="Line Chart - Multiple"
        subtitle="January - June 2024"
      />
      <LineChart
        data={lineChartData}
        categoryKey="month"
        theme="emerald"
        icons={icons}
        variant="step"
        width={460}
        height={300}
        strokeWidth={3}
      />
      <Footer>
        <Button iconRight={<Download />}>Download</Button>
      </Footer>
    </Card>
  );
};

const RaderChartComponent = () => {
  return (
    <Card style={{ width: "500px" }}>
      <Header
        actions={[
          <IconButton variant="tertiary" key="download-btn" size="small" icon={<TrendingUp />} />,
        ]}
        title="Rader Chart - Multiple"
        subtitle="January - June 2024"
      />
      <RaderChart
        data={radarChartData}
        categoryKey="month"
        theme="vivid"
        icons={icons}
        variant="area"
        width={460}
        height={300}
        strokeWidth={3}
        areaOpacity={1}
      />
      <Footer>
        <Button iconRight={<Download />}>Download</Button>
      </Footer>
    </Card>
  );
};
const meta = {
  title: "Components/Charts/BarChart",
  component: BarChartComponent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof BarChartComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BarChartStory: Story = {
  name: "Bar Chart",
  render: () => <BarChartComponent />,
};

export const AreaChartStory: Story = {
  name: "Area Chart",
  render: () => <AreaChartComponent />,
};

export const LineChartStory: Story = {
  name: "Line Chart",
  render: () => <LineChartComponent />,
};

export const RaderChartStory: Story = {
  name: "Rader Chart",
  render: () => <RaderChartComponent />,
};
