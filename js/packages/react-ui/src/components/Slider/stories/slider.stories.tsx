import type { Meta, StoryObj } from "@storybook/react";
import { Volume1Icon, Volume2Icon } from "lucide-react";
import { useState } from "react";
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
      control: false,
      options: ["continuous", "discrete"],
      description:
        "The type of slider - continuous for smooth sliding, or discrete for stepped values. Range functionality is enabled by passing an array with multiple values to `value` or `defaultValue`.",
      defaultValue: "continuous",
      table: {
        category: "Appearance",
        type: { summary: "'continuous' | 'discrete'" },
        required: true,
      },
    },
    min: {
      control: "number",
      description: "Minimum value of the slider",
      defaultValue: 0,
      table: {
        category: "Value",
        type: { summary: "number" },
        required: true,
      },
    },
    max: {
      control: "number",
      description: "Maximum value of the slider",
      defaultValue: 100,
      table: {
        category: "Value",
        type: { summary: "number" },
        required: true,
      },
    },
    step: {
      control: "number",
      description: "Step increment (required for discrete variant)",
      defaultValue: 1,
      table: {
        category: "Value",
        type: { summary: "number" },
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
        "Controlled value(s) of the slider. Single number for continuous/discrete, array of two numbers for range",
      table: {
        category: "Value",
        type: { summary: "number[]" },
      },
    },
    defaultValue: {
      description:
        "Default value(s) of the slider. Single number for continuous/discrete, array of two numbers for range",
      control: false,
      table: {
        category: "Value",
        type: { summary: "number[]" },
      },
    },
    onValueChange: {
      control: false,
      description: "Callback when the value changes",
      table: {
        category: "Events",
        type: { summary: "(value: number[]) => void" },
      },
    },
    className: {
      control: "text",
      description: "Additional CSS class names",
      table: {
        category: "Appearance",
        type: { summary: "string" },
      },
    },
    style: {
      control: "object",
      description: "Additional inline styles",
      table: {
        category: "Appearance",
        type: { summary: "React.CSSProperties" },
      },
    },
    leftContent: {
      control: "text",
      description: "Content to display on the left side of the slider",
      table: {
        category: "Appearance",
        type: { summary: "React.ReactNode" },
      },
    },
    rightContent: {
      control: "text",
      description: "Content to display on the right side of the slider",
      table: {
        category: "Appearance",
        type: { summary: "React.ReactNode" },
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
    defaultValue: [25],
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
    defaultValue: [50],
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
    variant: "continuous",
    min: 0,
    max: 100,
    defaultValue: [20, 80],
  },
  parameters: {
    docs: {
      description: {
        story: "A range slider allows selection of a value range using two handles.",
      },
    },
  },
};

export const DiscreteRange: Story = {
  args: {
    variant: "discrete",
    min: 0,
    max: 100,
    step: 10,
    defaultValue: [20, 80],
  },
  parameters: {
    docs: {
      description: {
        story:
          "A discrete range slider combines the features of a discrete slider and a range slider.",
      },
    },
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState([50]);
    return (
      <Slider
        variant="continuous"
        min={0}
        max={100}
        step={1}
        value={value}
        onValueChange={setValue}
        disabled={false}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "A controlled slider where the value is managed by component state via the `value` prop.",
      },
    },
  },
  name: "Controlled (with value prop)",
};

export const UncontrolledWithoutDefault: Story = {
  name: "Without Value or DefaultValue",
  args: {
    variant: "continuous",
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "A slider without an initial `value` or `defaultValue` prop. It defaults to the minimum value.",
      },
    },
  },
};

export const WithIcons: Story = {
  name: "With Icons",
  args: {
    variant: "continuous",
    min: 0,
    max: 100,
    defaultValue: [40],
    leftContent: <Volume1Icon />,
    rightContent: <Volume2Icon />,
  },
  parameters: {
    docs: {
      description: {
        story: "A slider can have icons or other content on either side.",
      },
    },
  },
};
