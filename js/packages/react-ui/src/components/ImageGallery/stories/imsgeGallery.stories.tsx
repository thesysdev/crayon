import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../Card";
import { Image } from "../../Image/Image";
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
    gap: 18,
  },
  render: (args) => (
    <Card style={{ width: "800px" }}>
      <ImageGallery {...args}>
        <Image
          src="https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGphcGFufGVufDB8fDB8fHww"
          alt="Image 1"
        />

        <Image
          src="https://plus.unsplash.com/premium_photo-1675610853926-6d69a0a99ea7?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGphcGFufGVufDB8fDB8fHww"
          alt="Image 3"
        />

        <Image
          src="https://images.unsplash.com/photo-1554797589-7241bb691973?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGphcGFufGVufDB8fDB8fHww"
          alt="Image 4"
        />
        <Image
          src="https://images.unsplash.com/photo-1492571350019-22de08371fd3?q=80&w=3906&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Image 2"
        />

        <Image
          src="https://plus.unsplash.com/premium_photo-1661878091370-4ccb8763756a?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8amFwYW58ZW58MHx8MHx8fDA%3D"
          alt="Image 5"
        />
      </ImageGallery>
    </Card>
  ),
};
