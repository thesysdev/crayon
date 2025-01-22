import type { Meta, StoryObj } from "@storybook/react";
import { ChevronRight, Mail, User } from "lucide-react";
import { ListItem } from "../../ListItem";
import "../../ListItem/listItem.scss";
import { ListBlock } from "../ListBlock";
import "../listBlock.scss";

const meta: Meta<typeof ListBlock> = {
  title: "Components/ListBlock",
  component: ListBlock,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ListBlock>;

export const Default: Story = {
  render: () => (
    <ListBlock>
      <ListItem
        decorativeIcon={User}
        title="John Doe"
        subtitle="Software Engineer"
        actionIcon={ChevronRight}
      />
      <ListItem
        decorativeIcon={Mail}
        title="Jane Smith"
        subtitle="Product Designer"
        actionIcon={ChevronRight}
      />
      <ListItem
        decorativeIcon={Mail}
        title="Simple Item"
        subtitle="Without icons"
        actionIcon={ChevronRight}
      />
    </ListBlock>
  ),
};

export const SingleItem: Story = {
  render: () => (
    <ListBlock>
      <ListItem
        decorativeIcon={User}
        title="Single Item"
        subtitle="With icons"
        actionIcon={ChevronRight}
      />
    </ListBlock>
  ),
};

export const NoIcons: Story = {
  render: () => (
    <ListBlock>
      <ListItem title="First Item" subtitle="Description here" />
      <ListItem title="Second Item" subtitle="Another description" />
    </ListBlock>
  ),
};
