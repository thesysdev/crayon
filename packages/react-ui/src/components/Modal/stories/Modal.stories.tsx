import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "../../Button";
import { Modal } from "../Modal";

type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    title: "Modal title",
    children: "This is the modal content.",
    size: "md",
  },
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)} variant="primary">
          Open modal
        </Button>

        <Modal title={args.title} size={args.size} open={open} onOpenChange={setOpen}>
          {args.children}
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A basic modal component opened by a button.",
      },
    },
  },
};

const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { Modal } from '@openuidev/react-ui';\n```",
      },
    },
    controls: {
      exclude: ["open", "onOpenChange"],
    },
  },
  argTypes: {
    title: {
      control: "text",
    },
    children: {
      control: "text",
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      table: {
        defaultValue: { summary: "md" },
      },
    },
    open: {
      control: false,
      table: {
        disable: true,
      },
    },
  },
  tags: ["autodocs", "!dev"],
};

export default meta;
