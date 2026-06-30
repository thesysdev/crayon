import type { Meta, StoryObj } from "@storybook/react";
import { SectionV2 } from "../SectionV2";

type Story = StoryObj<typeof SectionV2>;

export const Default: Story = {
  args: {
    trigger: "Section title",
    children: "This is the section content.",
  },
  parameters: {
    docs: {
      description: {
        story: "A basic section block with a trigger and content.",
      },
    },
  },
};

export const WithLongContent: Story = {
  args: {
    trigger: "Details",
    children: "This section can be used to group related content under a visual section heading.",
  },
  parameters: {
    docs: {
      description: {
        story: "A section block with longer content.",
      },
    },
  },
};

const meta: Meta<typeof SectionV2> = {
  title: "Components/SectionBlock",
  component: SectionV2,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { SectionV2 } from '@openuidev/react-ui';\n```",
      },
    },
  },
  argTypes: {
    trigger: {
      control: "text",
    },
    children: {
      control: "text",
    },
  },
  tags: ["autodocs", "!dev"],
};

export default meta;
