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
          "https://plus.unsplash.com/premium_photo-1736946873496-cb261d1c4962?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw4OHx8fGVufDB8fHx8fA%3D%3D",
          "https://images.unsplash.com/photo-1739890390449-609b1c6d2125?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMDR8fHxlbnwwfHx8fHw%3D",
          "https://images.unsplash.com/photo-1739826155350-db63e78c098c?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw5OHx8fGVufDB8fHx8fA%3D%3D",
          "https://images.unsplash.com/photo-1739560116855-23a8c43afb5c?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMjR8fHxlbnwwfHx8fHw%3D",
          "https://plus.unsplash.com/premium_photo-1738907349895-62b86fda1f42?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0Nnx8fGVufDB8fHx8fA%3D%3D",
        ]}
      />
    </div>
  ),
};
