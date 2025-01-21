import { Meta, StoryObj } from "@storybook/react";
import { TextArea } from "../TextArea";
import "../textArea.scss";

const meta = {
  title: "Components/TextArea",
  component: TextArea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter your text here",
  },
};

export const Small: Story = {
  args: {
    placeholder: "Small textarea",
    rows: 2,
  },
};

export const Large: Story = {
  args: {
    placeholder: "Large textarea",
    rows: 4,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "This textarea is disabled",
    value: "This textarea is disabled",
  },
};

export const WithValue: Story = {
  args: {
    value: "This is a pre-filled textarea with some content",
    placeholder: "Enter notes",
  },
};

export const WithCustomStyle: Story = {
  args: {
    placeholder: "Custom styled textarea",
    styles: {
      width: "400px",
      margin: "20px",
    },
  },
};

// Example with icons (you'll need to import your icon components)
export const WithIcons: Story = {
  args: {
    placeholder: "Textarea with icons",
    // iconLeft: <YourLeftIcon />,
    // iconRight: <YourRightIcon />,
  },
};
