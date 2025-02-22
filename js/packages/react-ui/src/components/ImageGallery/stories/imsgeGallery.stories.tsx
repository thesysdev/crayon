import type { Meta, StoryObj } from "@storybook/react";
import { ImageGallery } from "../ImageGallery";

const meta: Meta<typeof ImageGallery> = {
  title: "Components/ImageGallery",
  component: ImageGallery,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { ImageGallery } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    columnCount: {
      control: { type: "number", min: 1, max: 6 },
      description: "Number of columns in the gallery grid",
      table: {
        category: "Layout",
        defaultValue: { summary: "3" },
      },
    },
    gap: {
      control: { type: "number", min: 0, max: 40 },
      description: "Gap between images in pixels",
      table: {
        category: "Layout",
        defaultValue: { summary: "10" },
      },
    },
  },
  tags: ["autodocs", "!dev"],
} as Meta<typeof ImageGallery>;

export default meta;
type Story = StoryObj<typeof ImageGallery>;

export const ImageGalleryStory: Story = {
  args: {
    columnCount: 3,
    gap: 10,
  },
  render: (args) => (
    <div style={{ width: "800px" }}>
      <ImageGallery
        {...args}
        urls={[
          "https://images.unsplash.com/photo-1740021838495-591f6a2d97fa?q=80&w=3735&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          "https://images.unsplash.com/photo-1726137570000-70ae29f0ba01?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0MXx8fGVufDB8fHx8fA%3D%3D",
          "https://plus.unsplash.com/premium_photo-1738907349895-62b86fda1f42?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0Nnx8fGVufDB8fHx8fA%3D%3D",
          "https://images.unsplash.com/photo-1739946544837-266f0d1d1590?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw4MXx8fGVufDB8fHx8fA%3D%3D",
          "https://images.unsplash.com/photo-1739869610059-86fabc7bcd7b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw4Mnx8fGVufDB8fHx8fA%3D%3D",
          "https://plus.unsplash.com/premium_photo-1738907349895-62b86fda1f42?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0Nnx8fGVufDB8fHx8fA%3D%3D",
          "https://images.unsplash.com/photo-1735292626225-eb75b91f2ba2?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw1Nnx8fGVufDB8fHx8fA%3D%3D",
        ]}
      />
    </div>
  ),
};
