import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { DatePicker } from "../DatePicker";

const meta: Meta<typeof DatePicker> = {
  title: "Components/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { DatePicker } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "350px",
        }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    mode: {
      control: "radio",
      options: ["single", "range"],
      description: "The mode of date selection - either single date or date range",
      table: {
        category: "Behavior",
        type: {
          summary: "'single' | 'range'",
        },
        defaultValue: { summary: "single" },
      },
    },
    variant: {
      control: "radio",
      options: ["docked", "popover"],
      description: "The visual presentation style of the date picker",
      table: {
        category: "Appearance",
        type: {
          summary: "'docked' | 'popover'",
        },
        defaultValue: { summary: "docked" },
      },
    },
    selectedSingleDate: {
      control: false,
      description: "The currently selected date (for single mode)",
      table: {
        category: "State",
        type: {
          summary: "Date | undefined",
        },
      },
    },
    setSelectedSingleDate: {
      control: false,
      description: "Callback function to update the selected date (for single mode)",
      table: {
        category: "Callbacks",
        type: {
          summary: "(date: Date | undefined) => void",
        },
      },
    },
    selectedRangeDates: {
      control: false,
      description:
        "The currently selected date range (for range mode), use type DateRange from react-day-picker",
      table: {
        category: "State",
        type: {
          summary: "DateRange | undefined",
        },
      },
    },
    setSelectedRangeDates: {
      control: false,
      description:
        "Callback function to update the selected date range (for range mode), use type DateRange from react-day-picker",
      table: {
        category: "Callbacks",
        type: {
          summary: "(range: DateRange | undefined) => void",
        },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
        type: {
          summary: "string",
        },
      },
    },
    style: {
      control: false,
      description: "Inline CSS styles for custom styling",
      table: {
        category: "Styling",
        type: {
          summary: "CSSProperties",
        },
      },
    },
  },
  tags: ["!dev", "autodocs"],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic single date picker with docked variant
export const SinglePicker: Story = {
  render: (args) => (
    <DatePicker style={{ width: args.variant === "docked" ? "unset" : "350px" }} {...args} />
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
  parameters: {
    docs: {
      description: {
        story: "Range picker with docked variant. Select dates by dragging across the calendar",
      },
    },
  },
};

// Single date picker with floating variant
export const FloatingPicker: Story = {
  render: (args) => <DatePicker {...args} style={{ width: "350px" }} />,
  args: {
    mode: "single",
    variant: "popover",
  },
};

export const ControlledSingle: Story = {
  render: (args) => {
    const [selectedDate, setSelectedDate] = useState<Date>();
    return (
      <div>
        <DatePicker
          mode={args.mode}
          variant={args.variant}
          selectedSingleDate={selectedDate}
          setSelectedSingleDate={setSelectedDate}
        />
        <div style={{ marginTop: "1rem" }}>Selected date: {selectedDate?.toLocaleDateString()}</div>
      </div>
    );
  },
  args: {
    mode: "single",
    variant: "docked",
  },
  parameters: {
    docs: {
      source: {
        code: `
const ControlledDatePickerExample = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  
  return (
    <div>
      <DatePicker
        mode="single"
        variant="docked"
        selectedSingleDate={selectedDate}
        setSelectedSingleDate={setSelectedDate}
      />
      <div style={{ marginTop: "1rem" }}>
        Selected date: {selectedDate?.toLocaleDateString()}
      </div>
    </div>
  );
};`,
        language: "tsx",
        type: "code",
      },
    },
  },
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
  parameters: {
    docs: {
      source: {
        code: `
import { DateRange } from "react-day-picker";

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
        Selected range: {dateRange?.from?.toLocaleDateString()} - {dateRange?.to?.toLocaleDateString()}
      </div>
    </div>
  );
};`,
        language: "tsx",
        type: "code",
      },
    },
  },
};
