import type { Meta, StoryObj } from "@storybook/react";
import { DotMatrixLoader } from "../DotMatrixLoader";

const meta: Meta<typeof DotMatrixLoader> = {
  title: "Components/DotMatrixLoader",
  component: DotMatrixLoader,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          width: "100vw",
          minHeight: "100vh",
          backgroundColor: "var(--openui-background)",
        }}
      >
        <Story />
      </div>
    ),
  ],
  tags: ["dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof DotMatrixLoader>;

export const Default: Story = {};

export const Compact: Story = {
  args: {
    variant: "compact",
  },
};
