import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../Card";
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
    children: {
      control: { type: "object" },
    },
  },
  tags: ["autodocs", "!dev"],
} as Meta<typeof ImageGallery>;

export default meta;
type Story = StoryObj<typeof ImageGallery>;

export const ImageGalleryStory: Story = {
  render: (args) => (
    <Card style={{ width: "600px" }}>
      <ImageGallery
        {...args}
        images={[
          "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGphcGFufGVufDB8fDB8fHww",
          "https://plus.unsplash.com/premium_photo-1675610853926-6d69a0a99ea7?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGphcGFufGVufDB8fDB8fHww",
          "https://images.unsplash.com/photo-1554797589-7241bb691973?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGphcGFufGVufDB8fDB8fHww",
          "https://images.unsplash.com/photo-1492571350019-22de08371fd3?q=80&w=3906&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          "https://plus.unsplash.com/premium_photo-1661878091370-4ccb8763756a?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8amFwYW58ZW58MHx8MHx8fDA%3D",
          "https://images.unsplash.com/photo-1740412662676-a3b16d74ee86?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwzfHx8ZW58MHx8fHx8",
          "https://images.unsplash.com/photo-1740386072835-938733c974e1?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyNzh8fHxlbnwwfHx8fHw%3D",
        ]}
      ></ImageGallery>
    </Card>
  ),
};
