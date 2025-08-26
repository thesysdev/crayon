import type { Meta, StoryObj } from "@storybook/react";
import { ArrowRight, Download } from "lucide-react";
import { IconButton } from "../../IconButton";
import { CardHeader } from "../CardHeader";

const meta: Meta<typeof CardHeader> = {
  title: "Components/CardHeader",
  component: CardHeader,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { CardHeader } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "350px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "number", "answer"],
      description: "The visual style variant of the header",
      table: {
        category: "Appearance",
        type: { summary: "CardHeaderVariant" },
        defaultValue: { summary: "default" },
      },
    },
    icon: {
      control: false,
      description: "The icon to display in the header beside the title",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    title: {
      control: "text",
      description: "The title to display in the header",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    subtitle: {
      control: "text",
      description: "The subtitle to display in the header",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    actions: {
      control: false,
      description: "The actions to display in the header",
      table: {
        category: "Content",
        type: { summary: "ReactElement<ButtonProps | IconButtonProps>[]" },
      },
    },
    className: {
      control: false,
      description: "The class name to apply to the header",
      table: {
        category: "Styling",
        type: { summary: "string" },
      },
    },
    styles: {
      control: false,
      description: "Inline CSS styles for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
      },
    },
  },
  tags: ["autodocs", "!dev"],
};

export default meta;
type Story = StoryObj<typeof CardHeader>;

// Basic header stories
export const HeaderStory: Story = {
  args: {
    variant: "default",
    icon: <ArrowRight />,
    title: "Thesys Crayon",
    subtitle: "Crayon UI is a set of React components.",
    actions: [<IconButton variant="tertiary" size="small" icon={<Download />} />],
  },
  render: (args) => <CardHeader {...args} />,
};

export const HeaderStoryWithMultipleActions: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Passing multiple actions to the header. The actions are displayed in the right corner of the header.",
      },
    },
  },
  args: {
    variant: "default",
    icon: <ArrowRight />,
    title: "Thesys Crayon",
    subtitle: "Crayon UI is a set of React components.",
    actions: [
      <IconButton variant="tertiary" size="small" icon={<Download />} />,
      <IconButton variant="tertiary" size="small" icon={<Download />} />,
    ],
  },
  render: (args) => <CardHeader {...args} />,
};

export const DefaultVariant: Story = {
  parameters: {
    docs: {
      description: {
        story: "The default variant with larger text styling and 18px icon.",
      },
    },
  },
  args: {
    title: "Default Variant Header",
    subtitle: "This is the default variant with larger body text styling",
    actions: [<IconButton variant="tertiary" size="small" icon={<Download />} />],
  },
  render: (args) => <CardHeader {...args} />,
};
