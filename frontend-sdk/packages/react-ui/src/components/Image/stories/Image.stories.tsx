import { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../Card";
import { Image, ImageProps } from "../Image";
import "../image.scss";
import "./image.stories.scss";

const meta: Meta<typeof Image> = {
  title: "Components/Image",
  component: Image,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="image-story-container">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    aspectRatio: {
      control: "select",
      options: ["1:1", "3:2", "3:4", "4:3", "16:9"],
      description: "Uses Radix UI AspectRatio component",
    },
    scale: {
      control: "radio",
      options: ["fit", "fill"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Image>;

export const Default: Story = {
  args: {
    src: "https://picsum.photos/800/600",
    alt: "Sample image",
  },
};

export const WithAspectRatio: Story = {
  args: {
    src: "https://picsum.photos/800/600",
    alt: "Sample image with aspect ratio",
    aspectRatio: "16:9",
  },
};

export const WithScaleFit: Story = {
  args: {
    src: "https://picsum.photos/800/600",
    alt: "Sample image with fit scaling",
    aspectRatio: "1:1",
    scale: "fit",
  },
};

export const WithScaleFill: Story = {
  args: {
    src: "https://picsum.photos/800/600",
    alt: "Sample image with fill scaling",
    aspectRatio: "1:1",
    scale: "fill",
  },
};

export const InCard: Story = {
  render: (args) => (
    <Card>
      <Image {...args} />
      <h3>Card Title</h3>
      <p>This is how the image looks inside a card component.</p>
    </Card>
  ),
  args: {
    src: "https://picsum.photos/800/600",
    alt: "Sample image in card",
    aspectRatio: "16:9",
    scale: "fill",
  },
};

// Grid showing different aspect ratios
export const AspectRatioGrid: Story = {
  render: () => (
    <div className="image-grid">
      {["1:1", "3:2", "3:4", "4:3", "16:9"].map((ratio) => (
        <div key={ratio} className="image-grid-item">
          <h4>Aspect Ratio: {ratio}</h4>
          <Image
            src="https://picsum.photos/800/600"
            alt={`Aspect ratio ${ratio}`}
            aspectRatio={ratio as ImageProps["aspectRatio"]}
            scale="fill"
          />
        </div>
      ))}
    </div>
  ),
};

// Grid showing fit vs fill
export const ScaleComparison: Story = {
  render: () => (
    <div className="image-grid">
      {["fit", "fill"].map((scaleType) => (
        <div key={scaleType} className="image-grid-item">
          <h4>Scale: {scaleType}</h4>
          <Image
            src="https://picsum.photos/800/600"
            alt={`Scale ${scaleType}`}
            aspectRatio="16:9"
            scale={scaleType as ImageProps["scale"]}
          />
        </div>
      ))}
    </div>
  ),
};

export const WithCustomStyles: Story = {
  args: {
    src: "https://picsum.photos/800/600",
    alt: "Sample image with custom styles",
    styles: {
      border: "2px solid #000",
      borderRadius: "8px",
    },
  },
};
