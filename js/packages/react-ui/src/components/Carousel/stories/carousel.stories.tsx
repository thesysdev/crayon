import type { Meta, StoryObj } from "@storybook/react";
import {
  Building2,
  Camera,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Dog,
  Music,
  Palette,
  Plane,
  Shirt,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";
import { CardHeader } from "../../CardHeader";
import { IconButton } from "../../IconButton";
import { Image } from "../../Image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../Carousel";
import "../carousel.scss";

const meta: Meta<typeof Carousel> = {
  title: "Components/Carousel",
  component: Carousel,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { Carousel,CarouselContent,CarouselItem,CarouselNext,CarouselPrevious } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
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
      table: {
        category: "Behavior",
        type: { summary: "number" },
        defaultValue: { summary: "1" },
      },
    },
    noSnap: {
      control: "boolean",
      description: "Whether to disable snap scrolling",
      table: {
        category: "Behavior",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    showButtons: {
      control: "boolean",
      description: "Whether to show the navigation buttons",
      table: {
        category: "Appearance",
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    children: {
      control: false,
      description: "The carousel content and navigation buttons",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
        type: { summary: "string" },
      },
    },
    style: {
      control: false,
      description: "Inline CSS styles for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
      },
    },
  },
  tags: ["autodocs", "!dev"],
};

export default meta;
type Story = StoryObj<typeof Carousel>;

const items = [
  {
    title: "Nature",
    subtitle: "Beautiful landscapes",
    icon: <Camera />,
    imageUrl:
      "https://plus.unsplash.com/premium_photo-1719943510748-4b4354fbcf56?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Architecture",
    subtitle: "Modern buildings",
    icon: <Building2 />,
    imageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Technology",
    subtitle: "Digital innovation",
    icon: <Cpu />,
    imageUrl:
      "https://plus.unsplash.com/premium_photo-1663050756824-165ee7eafdac?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Art",
    subtitle: "Creative expressions",
    icon: <Palette />,
    imageUrl:
      "https://images.unsplash.com/photo-1550532422-378e93ec379c?q=80&w=3024&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Travel",
    subtitle: "World exploration",
    icon: <Plane />,
    imageUrl:
      "https://images.unsplash.com/photo-1504598318550-17eba1008a68?q=80&w=2848&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Food",
    subtitle: "Culinary delights",
    icon: <UtensilsCrossed />,
    imageUrl:
      "https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Sports",
    subtitle: "Athletic moments",
    icon: <Trophy />,
    imageUrl:
      "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?q=80&w=2992&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Wildlife",
    subtitle: "Animal kingdom",
    icon: <Dog />,
    imageUrl:
      "https://images.unsplash.com/photo-1600521605615-a8d3a23d8262?q=80&w=3874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Fashion",
    subtitle: "Style trends",
    icon: <Shirt />,
    imageUrl:
      "https://images.unsplash.com/photo-1521335629791-ce4aec67dd15?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Music",
    subtitle: "Sonic experiences",
    icon: <Music />,
    imageUrl:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

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
  render: ({ itemsToScroll, noSnap, showButtons }) => {
    const repeatedItems = Array.from({ length: items.length }, (_, index) => ({
      ...items[index % items.length],
      id: `item-${index + 1}`,
    }));

    return (
      <Carousel itemsToScroll={itemsToScroll} noSnap={noSnap} showButtons={showButtons}>
        <CarouselContent>
          {repeatedItems.map((item) => (
            <CarouselItem key={item.id}>
              <CardHeader
                title={item.title}
                subtitle={item.subtitle}
                actions={[<IconButton variant="tertiary" size="small" icon={item.icon} />]}
              />
              <Image src={item.imageUrl ?? ""} alt={`${item.title} image`} scale="fill" />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious icon={<ChevronLeft />} />
        <CarouselNext icon={<ChevronRight />} />
      </Carousel>
    );
  },
};
