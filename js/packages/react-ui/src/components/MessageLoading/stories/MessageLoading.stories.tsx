import { Meta, StoryObj } from "@storybook/react";
import { MessageLoading } from "../MessageLoading";

const meta: Meta<typeof MessageLoading> = {
  title: "Components/MessageLoading",
  component: MessageLoading,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { MessageLoading } from '@crayon-ui/react-ui';\n```",
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
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof MessageLoading>;

export const Default: Story = {
  render: () => <MessageLoading />,
  parameters: {
    docs: {
      description: {
        story: "A loading indicator that appears while a message is being processed.",
      },
    },
  },
};
