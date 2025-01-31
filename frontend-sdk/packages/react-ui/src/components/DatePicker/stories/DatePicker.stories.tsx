import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import "../../IconButton/iconButton.scss";
import "../../Select/select.scss";
import { DatePicker } from "../DatePicker";
import "../datePicker.scss";

const meta = {
  title: "Components/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic single date picker with docked variant
export const Default: Story = {
  render: (args) => (
    <div style={{ width: "400px", height: `${args.variant === "docked" ? "unset" : "400px"}` }}>
      <DatePicker {...args} />
    </div>
  ),
  args: {
    mode: "single",
    variant: "docked",
  },
};

// Range date picker with docked variant
export const RangePicker: Story = {
  args: {
    mode: "range",
    variant: "docked",
  },
};

// Single date picker with floating variant
export const FloatingPicker: Story = {
  render: () => (
    <div style={{ width: "600px" }}>
      <DatePicker mode="single" variant="floating" />
    </div>
  ),
};

// Controlled single date picker
const ControlledSinglePicker = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();

  return (
    <div>
      <DatePicker
        mode="single"
        variant="docked"
        selectedSingleDate={selectedDate}
        setSelectedSingleDate={setSelectedDate}
      />
      <div style={{ marginTop: "1rem" }}>Selected date: {selectedDate?.toLocaleDateString()}</div>
    </div>
  );
};

export const ControlledSingle: Story = {
  render: () => <ControlledSinglePicker />,
};

// Controlled range date picker
const ControlledRangePicker = () => {
  const [dateRange, setDateRange] = useState<DateRange>();

  return (
    <div>
      <DatePicker
        mode="range"
        variant="docked"
        selectedRangeDates={dateRange}
        setSelectedRangeDates={setDateRange}
      />
      <div style={{ marginTop: "1rem" }}>
        Selected range: {dateRange?.from?.toLocaleDateString()} -{" "}
        {dateRange?.to?.toLocaleDateString()}
      </div>
    </div>
  );
};

export const ControlledRange: Story = {
  render: () => <ControlledRangePicker />,
};
