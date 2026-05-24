import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "../../Button";
import { Modal } from "../Modal";

const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { Modal } from '@openui-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    title: {
      control: "text",
      description: "Modal title",
      table: {
        category: "Content",
        type: { summary: "string" },
      },
    },
    open: {
      control: "boolean",
      description: "Whether the modal is open",
      table: {
        category: "State",
        type: { summary: "boolean" },
      },
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "Modal size",
      table: {
        category: "Appearance",
        type: { summary: "sm | md | lg" },
        defaultValue: { summary: "md" },
      },
    },
    children: {
      control: "text",
      description: "Modal body content",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
  },
  tags: ["autodocs", "!dev"],
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    title: "Confirm action",
    open: true,
    size: "md",
    children: "Are you sure you want to proceed with this action?",
  },
};

export const Small: Story = {
  args: {
    title: "Delete item",
    open: true,
    size: "sm",
    children: "This will permanently delete the selected item.",
  },
};

export const Large: Story = {
  args: {
    title: "Edit profile",
    open: true,
    size: "lg",
    children: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Update your profile information below.</p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            background: "var(--openui-sunk)",
            padding: "16px",
            borderRadius: "8px",
          }}
        >
          <div>Profile settings and preferences go here.</div>
        </div>
      </div>
    ),
  },
};

export const WithTrigger: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open modal
        </Button>
        <Modal title="Interactive modal" open={open} onOpenChange={setOpen}>
          <p>This modal is controlled by the button above. Click outside or press Escape to close.</p>
        </Modal>
      </>
    );
  },
};
