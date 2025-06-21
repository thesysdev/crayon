import type { Meta, StoryObj } from "@storybook/react";
import { ChevronRight } from "lucide-react";
import { ListItem } from "../../ListItem";
import { ListBlock } from "../ListBlock";

const meta: Meta<typeof ListBlock> = {
  title: "Components/ListBlock",
  component: ListBlock,
  subcomponents: {
    ListItem: ListItem as any,
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { ListBlock, ListItem } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "400px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    children: {
      control: false,
      description: "Accepts ListItem components as children",
      table: {
        category: "Content",
        type: { summary: "ListItemProps" },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Appearance",
      },
    },
    style: {
      control: false,
      description: "Additional CSS style for custom styling",
      table: {
        category: "Appearance",
      },
    },
  },
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof ListBlock>;

export const ListBlockWithItems: Story = {
  render: (args) => (
    <ListBlock>
      <ListItem
        image="https://images.unsplash.com/photo-1747171232839-a5fea879ca59?q=80&w=3840&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        title="John Doe"
        subtitle="Software Engineer"
        actionIcon={<ChevronRight size={16} />}
      />
      <ListItem
        image="https://images.unsplash.com/photo-1747171232839-a5fea879ca59?q=80&w=3840&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        title="Jane Smith"
        subtitle="Product Designer"
        actionIcon={<ChevronRight size={16} />}
      />
      <ListItem
        image="https://images.unsplash.com/photo-1747171232839-a5fea879ca59?q=80&w=3840&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        title="Ankit Das"
        subtitle="Software Developer"
        actionIcon={<ChevronRight size={16} />}
      />
    </ListBlock>
  ),
};
