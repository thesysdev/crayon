import type { Meta, StoryObj } from "@storybook/react";
import { ChevronRight, User } from "lucide-react";
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
        component: "```tsx\nimport { ListBlock, ListItem } from '@openui-ui/react-ui';\n```",
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
    variant: {
      control: "select",
      options: ["number", "icon", "image"],
      description: "Controls the indicator type for every ListItem in the list.",
      table: { category: "Appearance", defaultValue: { summary: "number" } },
    },
    children: { control: false, table: { category: "Content" } },
    className: { control: false, table: { category: "Appearance" } },
    style: { control: false, table: { category: "Appearance" } },
  },
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof ListBlock>;

export const NumberWithSubtitle: Story = {
  render: () => (
    <ListBlock variant="number">
      <ListItem
        title="Set up your workspace"
        subtitle="Install dependencies and configure your environment"
      />
      <ListItem title="Create your first component" subtitle="Build a reusable UI element" />
      <ListItem title="Publish to production" subtitle="Deploy and share your work" />
    </ListBlock>
  ),
};

export const NumberNoSubtitle: Story = {
  render: () => (
    <ListBlock variant="number">
      <ListItem title="Set up your workspace" />
      <ListItem title="Create your first component" />
      <ListItem title="Publish to production" />
    </ListBlock>
  ),
};

export const NumberClickable: Story = {
  render: () => (
    <ListBlock variant="number">
      <ListItem
        title="Set up your workspace"
        subtitle="Install dependencies and configure your environment"
        actionLabel="Start"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Step 1")}
      />
      <ListItem
        title="Create your first component"
        subtitle="Build a reusable UI element"
        actionLabel="Start"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Step 2")}
      />
      <ListItem
        title="Publish to production"
        subtitle="Deploy and share your work"
        actionLabel="Start"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Step 3")}
      />
    </ListBlock>
  ),
};

export const IconWithSubtitle: Story = {
  render: () => (
    <ListBlock variant="icon">
      <ListItem icon={<User size={16} />} title="John Doe" subtitle="Software Engineer" />
      <ListItem icon={<User size={16} />} title="Jane Smith" subtitle="Product Designer" />
      <ListItem icon={<User size={16} />} title="Ankit Das" subtitle="Software Developer" />
    </ListBlock>
  ),
};

export const IconNoSubtitle: Story = {
  render: () => (
    <ListBlock variant="icon">
      <ListItem icon={<User size={16} />} title="John Doe" />
      <ListItem icon={<User size={16} />} title="Jane Smith" />
      <ListItem icon={<User size={16} />} title="Ankit Das" />
    </ListBlock>
  ),
};

export const IconClickable: Story = {
  render: () => (
    <ListBlock variant="icon">
      <ListItem
        icon={<User size={16} />}
        title="John Doe"
        subtitle="Software Engineer"
        actionLabel="View Profile"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("John Doe")}
      />
      <ListItem
        icon={<User size={16} />}
        title="Jane Smith"
        subtitle="Product Designer"
        actionLabel="View Profile"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Jane Smith")}
      />
      <ListItem
        icon={<User size={16} />}
        title="Ankit Das"
        subtitle="Software Developer"
        actionLabel="View Profile"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Ankit Das")}
      />
    </ListBlock>
  ),
};

export const ImageWithSubtitle: Story = {
  render: () => (
    <ListBlock variant="image">
      <ListItem
        image={{ src: "https://i.pravatar.cc/40?img=1", alt: "John" }}
        title="John Doe"
        subtitle="Software Engineer"
      />
      <ListItem
        image={{ src: "https://i.pravatar.cc/40?img=2", alt: "Jane" }}
        title="Jane Smith"
        subtitle="Product Designer"
      />
      <ListItem
        image={{ src: "https://i.pravatar.cc/40?img=3", alt: "Ankit" }}
        title="Ankit Das"
        subtitle="Software Developer"
      />
    </ListBlock>
  ),
};

export const ImageNoSubtitle: Story = {
  render: () => (
    <ListBlock variant="image">
      <ListItem image={{ src: "https://i.pravatar.cc/40?img=1", alt: "John" }} title="John Doe" />
      <ListItem image={{ src: "https://i.pravatar.cc/40?img=2", alt: "Jane" }} title="Jane Smith" />
      <ListItem image={{ src: "https://i.pravatar.cc/40?img=3", alt: "Ankit" }} title="Ankit Das" />
    </ListBlock>
  ),
};

export const ImageClickable: Story = {
  render: () => (
    <ListBlock variant="image">
      <ListItem
        image={{ src: "https://i.pravatar.cc/40?img=1", alt: "John" }}
        title="John Doe"
        subtitle="Software Engineer"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("John Doe")}
      />
      <ListItem
        image={{ src: "https://i.pravatar.cc/40?img=2", alt: "Jane" }}
        title="Jane Smith"
        subtitle="Product Designer"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Jane Smith")}
      />
      <ListItem
        image={{ src: "https://i.pravatar.cc/40?img=3", alt: "Ankit" }}
        title="Ankit Das"
        subtitle="Software Developer"
        actionIcon={<ChevronRight size={16} />}
        onClick={() => alert("Ankit Das")}
      />
    </ListBlock>
  ),
};
