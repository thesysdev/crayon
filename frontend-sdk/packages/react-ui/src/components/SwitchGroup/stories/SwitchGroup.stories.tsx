import { Meta, StoryObj } from "@storybook/react";
import "../../Label/Label.scss";
import { SwitchItem } from "../../SwitchItem";
import "../../SwitchItem/switchItem.scss";
import { SwitchGroup } from "../SwitchGroup";
import "../switchGroup.scss";

const meta: Meta<typeof SwitchGroup> = {
  title: "Components/SwitchGroup",
  component: SwitchGroup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SwitchGroup>;

export const Default: Story = {
  render: () => (
    <SwitchGroup>
      <SwitchItem value="option1" label="Option 1" />
      <SwitchItem value="option2" label="Option 2" />
      <SwitchItem value="option3" label="Option 3" />
    </SwitchGroup>
  ),
};

export const CardVariant: Story = {
  render: () => (
    <SwitchGroup variant="card">
      <SwitchItem value="option1" label="Option 1" />
      <SwitchItem value="option2" label="Option 2" />
      <SwitchItem value="option3" label="Option 3" />
    </SwitchGroup>
  ),
};

export const SunkVariant: Story = {
  render: () => (
    <SwitchGroup variant="sunk">
      <SwitchItem value="option1" label="Option 1" />
      <SwitchItem value="option2" label="Option 2" />
      <SwitchItem value="option3" label="Option 3" />
    </SwitchGroup>
  ),
};

export const WithCustomClassName: Story = {
  render: () => (
    <SwitchGroup className="custom-class">
      <SwitchItem value="option1" label="Option 1" />
      <SwitchItem value="option2" label="Option 2" />
      <SwitchItem value="option3" label="Option 3" />
    </SwitchGroup>
  ),
};

export const WithCustomStyle: Story = {
  render: () => (
    <SwitchGroup style={{ maxWidth: "300px", margin: "20px" }}>
      <SwitchItem value="option1" label="Option 1" />
      <SwitchItem value="option2" label="Option 2" />
      <SwitchItem value="option3" label="Option 3" />
    </SwitchGroup>
  ),
};
