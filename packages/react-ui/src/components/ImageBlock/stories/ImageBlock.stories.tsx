import { Meta, StoryObj } from "@storybook/react";
import { ImageBlock } from "../ImageBlock";

const meta: Meta<typeof ImageBlock> = {
  title: "Components/ImageBlock",
  component: ImageBlock,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "```tsx\nimport { ImageBlock } from '@openuidev/react-ui';\n```\n\nA hero/showcase image with a blurred backdrop effect, responsive sizing, and loading/error states.",
      },
    },
  },
  argTypes: {
    src: {
      control: "text",
      description: "Image source URL",
      table: { category: "Content" },
    },
    alt: {
      control: "text",
      description: "Alternative text for the image",
      table: { category: "Content" },
    },
    className: {
      control: false,
      description: "Additional CSS classes",
      table: { category: "Styling" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageBlock>;

const sampleImage =
  "https://images.unsplash.com/photo-1738168246881-40f35f8aba0a?w=800&auto=format&fit=crop&q=60";

export const Default: Story = {
  args: {
    src: sampleImage,
    alt: "Sample landscape",
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, margin: "auto" }}>
        <Story />
      </div>
    ),
  ],
};

export const Mobile: Story = {
  args: {
    src: sampleImage,
    alt: "Mobile view",
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320, margin: "auto" }}>
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = {
  args: {
    src: sampleImage,
    alt: "Loading state",
    imageLoading: true,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, margin: "auto" }}>
        <Story />
      </div>
    ),
  ],
};

export const Error: Story = {
  args: {
    src: "https://invalid-url-that-will-fail.example/image.jpg",
    alt: "Broken image",
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, margin: "auto" }}>
        <Story />
      </div>
    ),
  ],
};
