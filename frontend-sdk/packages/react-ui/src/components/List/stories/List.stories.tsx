import type { Meta, StoryObj } from "@storybook/react";
import { ChevronRight, Mail, User } from "lucide-react";
import { ListItem } from "../../ListItem";
import "../../ListItem/listItem.scss";
import List from "../List";
import "../list.scss";

const meta: Meta<typeof List> = {
  title: "Components/List",
  component: List,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof List>;

export const Default: Story = {
  render: () => (
    <List>
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
    </List>
  ),
};

export const SingleItem: Story = {
  render: () => (
    <List>
      <ListItem
        decorativeIcon={User}
        title="Single Item"
        subtitle="With icons"
        actionIcon={ChevronRight}
      />
    </List>
  ),
};

export const NoIcons: Story = {
  render: () => (
    <List>
      <ListItem title="First Item" subtitle="Description here" />
      <ListItem title="Second Item" subtitle="Another description" />
    </List>
  ),
};
