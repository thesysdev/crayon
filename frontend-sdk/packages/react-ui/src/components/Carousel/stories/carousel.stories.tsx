import type { Meta, StoryObj } from "@storybook/react";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { CardHeader } from "../../CardHeader";
import "../../CardHeader/cardHeader.scss";
import { IconButton } from "../../IconButton";
import "../../IconButton/iconButton.scss";
import { Image } from "../../Image";
import "../../Image/image.scss";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../Carousel";
import "../carousel.scss";

interface CarouselStoryProps {
  itemsToScroll: number;
  noSnap?: boolean;
  showButtons: boolean;
}

const meta: Meta<CarouselStoryProps> = {
  title: "Components/Carousel",
  component: Carousel as any,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "28rem" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    itemsToScroll: {
      control: "number",
      description: "Number of items to scroll when clicking navigation buttons",
      defaultValue: 1,
    },
    noSnap: {
      control: "boolean",
      description: "Whether to disable snap scrolling",
      defaultValue: false,
    },
    showButtons: {
      control: "boolean",
      description: "Whether to show the navigation buttons",
      defaultValue: true,
    },
  },
};

export default meta;
type Story = StoryObj<CarouselStoryProps>;

const CarouselDemo = ({ itemsToScroll, noSnap, showButtons }: CarouselStoryProps) => {
  const items = [
    {
      title: "Nature",
      subtitle: "Beautiful landscapes",
      imageWidth: 400,
      imageHeight: 300,
    },
    {
      title: "Architecture",
      subtitle: "Modern buildings",
      imageWidth: 500,
      imageHeight: 400,
    },
    {
      title: "Technology",
      subtitle: "Digital innovation",
      imageWidth: 600,
      imageHeight: 500,
    },
    {
      title: "Art",
      subtitle: "Creative expressions",
      imageWidth: 700,
      imageHeight: 600,
    },
    {
      title: "Travel",
      subtitle: "World exploration",
      imageWidth: 800,
      imageHeight: 700,
    },
  ];

  const repeatedItems = Array.from({ length: 20 }, (_, index) => ({
    ...items[index % items.length],
    id: `item-${index + 1}`,
  }));

  const carouselItems = repeatedItems.map((item) => (
    <CarouselItem key={item.id}>
      <CardHeader
        title={item.title}
        subtitle={item.subtitle}
        actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
      />
      <Image
        src={`https://picsum.photos/${item.imageWidth}/${item.imageHeight}`}
        alt={`${item.title} image`}
        scale="fill"
      />
    </CarouselItem>
  ));

  return (
    <Carousel itemsToScroll={itemsToScroll} noSnap={noSnap} showButtons={showButtons}>
      <CarouselContent>{carouselItems}</CarouselContent>
      <CarouselPrevious icon={<ChevronLeft />} />
      <CarouselNext icon={<ChevronRight />} />
    </Carousel>
  );
};

export const Default: Story = {
  args: {
    itemsToScroll: 1,
    noSnap: false,
    showButtons: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Default carousel configuration with single item scrolling and navigation buttons.",
      },
    },
  },
  render: (args) => <CarouselDemo {...args} />,
};

export const MultipleItems: Story = {
  args: {
    itemsToScroll: 2,
    noSnap: false,
    showButtons: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Carousel configured to scroll multiple items at once when clicking navigation buttons.",
      },
    },
  },
  render: (args) => <CarouselDemo {...args} />,
};

export const WithNoSnap: Story = {
  args: {
    itemsToScroll: 1,
    noSnap: true,
    showButtons: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Carousel with no snap scrolling, useful for custom layout requirements.",
      },
    },
  },
  render: (args) => <CarouselDemo {...args} />,
};

export const WithNoButtons: Story = {
  args: {
    itemsToScroll: 1,
    noSnap: true,
    showButtons: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Carousel without navigation buttons, relying on native scroll behavior.",
      },
    },
  },
  render: (args) => <CarouselDemo {...args} />,
};
