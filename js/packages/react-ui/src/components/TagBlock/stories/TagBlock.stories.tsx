import type { Meta, StoryObj } from "@storybook/react";
import { Heart, Info, Star, User } from "lucide-react";
import { Tag } from "../../Tag";
import { TagBlock } from "../TagBlock";

const meta: Meta<typeof TagBlock> = {
  title: "Components/TagBlock",
  component: TagBlock,
  subcomponents: {
    Tag: Tag as any,
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { TagBlock, Tag } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description: "Accepts Tag components as children",
      table: {
        category: "Content",
        type: { summary: "ReactElement<typeof Tag> | ReactElement<typeof Tag>[]" },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
        type: { summary: "string" },
      },
    },
    styles: {
      control: false,
      description: "Additional CSS styles for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
      },
    },
  },
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof TagBlock>;

export const Default: Story = {
  render: (args) => (
    <TagBlock {...args}>
      <Tag variant="info" icon={<Info size={16} />} size="md" text="Info" />
      <Tag variant="success" icon={<Star size={16} />} size="md" text="Star" />
      <Tag variant="warning" icon={<Heart size={16} />} size="lg" text="Heart" />
      <Tag variant="danger" icon={<User size={16} />} size="lg" text="User" />
      <Tag variant="neutral" icon={<User size={16} />} size="lg" text="User" />
    </TagBlock>
  ),
};
