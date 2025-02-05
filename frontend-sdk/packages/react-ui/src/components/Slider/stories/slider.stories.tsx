import type { Meta, StoryObj } from "@storybook/react";
import { Slider, SliderProps } from "../Slider";
import "../slider.scss";

const meta: Meta<SliderProps> = {
  title: "Components/Slider",
  component: Slider,
  parameters: {
    layout: "centered",
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    variant: {
      control: "radio",
      options: ["continuous", "discrete", "range"],
      description:
        "The type of slider - continuous for smooth sliding, discrete for stepped values, or range for selecting a range",
      defaultValue: "continuous",
    },
    min: {
      control: "number",
      description: "Minimum value of the slider",
      defaultValue: 0,
    },
    max: {
      control: "number",
      description: "Maximum value of the slider",
      defaultValue: 100,
    },
    step: {
      control: "number",
      description: "Step increment (required for discrete variant)",
      defaultValue: 1,
    },
    disabled: {
      control: "boolean",
      description: "Whether the slider is disabled",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    value: {
      control: false,
      description:
        "Current value(s) of the slider. Single number for continuous/discrete, array of two numbers for range",
    },
    className: {
      control: "text",
      description: "Additional CSS class names",
      table: {
        disable: true,
      },
    },
    style: {
      control: "object",
      description: "Additional inline styles",
      table: {
        disable: true,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "400px", padding: "2rem" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Continuous: Story = {
  args: {
    variant: "continuous",
    min: 0,
    max: 100,
    step: 1,
    value: [50],
    onValueChange: (value) => console.log("Value changed:", value),
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: "A continuous slider allows smooth, precise value selection across its range.",
      },
    },
  },
};

export const Discrete: Story = {
  args: {
    variant: "discrete",
    min: 0,
    max: 100,
    step: 10,
    value: [50],
    onValueChange: (value) => console.log("Value changed:", value),
  },
  parameters: {
    docs: {
      description: {
        story:
          "A discrete slider shows step markers and snaps to specific values. Useful for selecting from predefined options.",
      },
    },
  },
};

export const Range: Story = {
  args: {
    variant: "range",
    min: 0,
    max: 100,
    step: 1,
    value: [25, 75],
    onValueChange: (value) => console.log("Range changed:", value),
  },
  parameters: {
    docs: {
      description: {
        story: "A range slider allows selection of a value range using two handles.",
      },
    },
  },
};

export const SmallSteps: Story = {
  args: {
    variant: "discrete",
    min: 0,
    max: 1,
    step: 0.1,
    value: [0.5],
    onValueChange: (value) => console.log("Value changed:", value),
  },
  parameters: {
    docs: {
      description: {
        story: "Slider configured with small decimal steps, useful for precise value selection.",
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    variant: "continuous",
    min: 0,
    max: 100,
    step: 1,
    disabled: true,
    value: [50],
    onValueChange: (value) => console.log("Value changed:", value),
  },
  parameters: {
    docs: {
      description: {
        story: "A disabled slider prevents user interaction and shows a visual disabled state.",
      },
    },
  },
};

export const CustomRange: Story = {
  args: {
    variant: "continuous",
    min: -50,
    max: 50,
    step: 5,
    value: [0],
    onValueChange: (value) => console.log("Value changed:", value),
  },
  parameters: {
    docs: {
      description: {
        story: "A slider with a custom range, including negative values.",
      },
    },
  },
};
