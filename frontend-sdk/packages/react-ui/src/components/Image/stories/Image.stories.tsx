import { Meta, StoryObj } from "@storybook/react";
import { Image } from "../Image";
import "../image.scss";

const meta: Meta<typeof Image> = {
  title: "Components/Image",
  component: Image,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div
        style={{
          maxWidth: 400,
          margin: "auto",
        }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    className: {
      control: false,
      description: "Additional CSS classes to apply to the image",
      table: {
        category: "Styling",
      },
    },
    styles: {
      control: false,
      description: "Additional CSS styles to apply to the image",
      table: {
        category: "Styling",
      },
    },
    aspectRatio: {
      control: "select",
      options: ["1:1", "3:2", "3:4", "4:3", "16:9"],
      description: "Uses Radix UI AspectRatio component",
      table: {
        category: "Appearance",
        type: { summary: "string" },
        defaultValue: { summary: "3:2" },
      },
    },
    scale: {
      control: "radio",
      options: ["fit", "fill"],
      description: "The scaling behavior of the image",
      table: {
        category: "Appearance",
        type: { summary: "string" },
        defaultValue: { summary: "fit" },
      },
    },
    src: {
      control: "text",
      description: "The source URL of the image",
      table: {
        category: "Content",
      },
    },
    alt: {
      control: "text",
      description: "The alternative text for the image",
      table: {
        category: "Content",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Image>;

export const Default: Story = {
  args: {
    src: "https://picsum.photos/800/600",
    alt: "Sample image",
    aspectRatio: "3:2",
    scale: "fit",
  },
};
