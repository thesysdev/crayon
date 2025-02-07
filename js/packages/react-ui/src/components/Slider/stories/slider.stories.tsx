import type { Meta, StoryObj } from "@storybook/react";
import { Slider, SliderProps } from "../Slider";

const meta: Meta<SliderProps> = {
  title: "Components/Slider",
  component: Slider,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { Slider } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  tags: ["!dev", "autodocs"],

  argTypes: {
    variant: {
      control: "radio",
      options: ["continuous", "discrete", "range"],
      description:
        "The type of slider - continuous for smooth sliding, discrete for stepped values, or range for selecting a range",
      defaultValue: "continuous",
      table: {
        category: "Appearance",
      },
    },
    min: {
      control: "number",
      description: "Minimum value of the slider",
      defaultValue: 0,
      table: {
        category: "Value",
      },
    },
    max: {
      control: "number",
      description: "Maximum value of the slider",
      defaultValue: 100,
      table: {
        category: "Value",
      },
    },
    step: {
      control: "number",
      description: "Step increment (required for discrete variant)",
      defaultValue: 1,
      table: {
        category: "Value",
      },
    },
    disabled: {
      control: "boolean",
      description: "Whether the slider is disabled",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "State",
      },
    },
    value: {
      control: false,
      description:
        "Current value(s) of the slider. Single number for continuous/discrete, array of two numbers for range",
      table: {
        category: "Value",
      },
    },
    className: {
      control: "text",
      description: "Additional CSS class names",
      table: {
        disable: true,
        category: "Appearance",
      },
    },
    style: {
      control: "object",
      description: "Additional inline styles",
      table: {
        disable: true,
        category: "Appearance",
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
