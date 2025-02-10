import { Meta, StoryObj } from "@storybook/react";
import { Image } from "../Image";

const meta: Meta<typeof Image> = {
  title: "Components/Image",
  component: Image,
  tags: ["!dev", "autodocs"],
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
  parameters: {
    docs: {
      description: {
        component: "```tsx\nimport { Image } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
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

const randomImage = [
  "https://images.unsplash.com/photo-1738168246881-40f35f8aba0a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyNnx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1736354485341-d165463e0133?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyMnx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1738522477288-82f5db85cfc3?q=80&w=2973&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1736794781970-ae55b6e3a13e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw3MHx8fGVufDB8fHx8fA%3D%3D",
];

export const Default: Story = {
  args: {
    src: randomImage[Math.floor(Math.random() * randomImage.length)],
    alt: "Sample image",
    aspectRatio: "3:2",
    scale: "fill",
  },
};
