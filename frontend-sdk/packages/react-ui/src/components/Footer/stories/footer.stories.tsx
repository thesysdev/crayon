import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../../Button";
import { Footer } from "../Footer";
import "../footer.scss";

const meta: Meta<typeof Footer> = {
  title: "Components/Footer",
  component: Footer,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "radio",
      options: ["horizontal", "vertical"],
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Footer>;

// Basic footer stories
export const FooterStory: Story = {
  args: {
    variant: "horizontal",
  },
  render: (args) => (
    <div style={{ width: "500px" }}>
      <Footer variant={args.variant}>
        <Button>Cancel</Button>
        <Button>Save</Button>
      </Footer>
    </div>
  ),
};
