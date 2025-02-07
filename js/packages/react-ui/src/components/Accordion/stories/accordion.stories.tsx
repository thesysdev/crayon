import type { Meta, StoryObj } from "@storybook/react";
import { Bird, Dog, Fish } from "lucide-react";
import { CardHeader } from "../../CardHeader";
import { IconButton } from "../../IconButton";
import { Image } from "../../Image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../Accordion";

interface AccordionStoryProps {
  type: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string;
  variant?: "card" | "sunk";
  showIcons?: boolean;
}

const meta: Meta<AccordionStoryProps> = {
  title: "Components/Accordion",
  component: Accordion as any,
  tags: ["autodocs", "!dev"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "400px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    type: {
      control: "radio",
      options: ["single", "multiple"],
      description: "The type of accordion behavior - single item open or multiple items",
      defaultValue: "single",
      table: {
        category: "Behavior",
      },
    },
    collapsible: {
      control: "boolean",
      description: "Whether the accordion items can be collapsed (only available for single type)",
      defaultValue: true,
      if: { arg: "type", eq: "single" },
      table: {
        category: "Behavior",
      },
    },
    defaultValue: {
      description: 'The default opened item value (only for type="single")',
      control: false,
      table: {
        category: "Behavior",
      },
    },
    variant: {
      control: "radio",
      options: ["card", "sunk"],
      description: "The visual style variant of the accordion",
      defaultValue: "card",
      table: {
        category: "Appearance",
      },
    },
    showIcons: {
      control: "boolean",
      description: "Whether to show icons in the accordion triggers",
      defaultValue: false,
      table: {
        category: "Appearance",
      },
    },
  },
};

export default meta;
type Story = StoryObj<AccordionStoryProps>;

const cityItems = [
  {
    value: "city-1",
    title: "New York",
    subtitle: "The Big Apple",
    description: "Iconic skyline and urban culture",
    image:
      "https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    value: "city-2",
    title: "Tokyo",
    subtitle: "Modern Metropolis",
    description: "Blend of tradition and technology",
    image:
      "https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    value: "city-3",
    title: "Paris",
    subtitle: "City of Light",
    description: "Romance and architecture",
    image:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=3820&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

const landscapeItems = [
  {
    value: "landscape-1",
    title: "Mountains",
    subtitle: "Alpine Views",
    description: "Majestic mountain ranges",
    image:
      "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    value: "landscape-2",
    title: "Beaches",
    subtitle: "Coastal Beauty",
    description: "Pristine shorelines",
    image:
      "https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    value: "landscape-3",
    title: "Forests",
    subtitle: "Woodland Wonder",
    description: "Dense forest landscapes",
    image:
      "https://images.pexels.com/photos/240040/pexels-photo-240040.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
];

const animalItems = [
  {
    value: "animal-1",
    title: "Big Cats",
    icon: <Dog />,
    subtitle: "Majestic Felines",
    description: "Lions, tigers, and leopards",
    image:
      "https://images.pexels.com/photos/145939/pexels-photo-145939.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    value: "animal-2",
    title: "Marine Life",
    icon: <Fish />,
    subtitle: "Ocean Dwellers",
    description: "Underwater creatures",
    image:
      "https://plus.unsplash.com/premium_photo-1661835524331-cbba987ba74c?q=80&w=3878&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "animal-3",
    title: "Birds",
    icon: <Bird />,
    subtitle: "Aerial Beauty",
    description: "Colorful avian species",
    image:
      "https://images.pexels.com/photos/326900/pexels-photo-326900.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
];

export const SingleAccordion: Story = {
  args: {
    type: "single",
    collapsible: true,
    variant: "card",
    showIcons: true,
  },
  parameters: {
    docs: {
      description: {
        story: "An accordion showcasing different cities and their urban landscapes.",
      },
    },
  },
  render: (args) => (
    <Accordion type={args.type} collapsible={args.collapsible}>
      {cityItems.map((item) => (
        <AccordionItem key={item.value} value={item.value} variant={args.variant}>
          <AccordionTrigger text={item.title} />
          <AccordionContent>
            <CardHeader title={item.subtitle} subtitle={item.description} />
            <Image src={item.image} alt={item.title} scale="fill" />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};

export const MultipleAccordion: Story = {
  args: {
    type: "multiple",
    variant: "card",
    showIcons: true,
  },
  parameters: {
    docs: {
      description: {
        story: "An example of an Accordion that allows multiple items to be open simultaneously.",
      },
    },
  },
  render: (args) => (
    <Accordion type="multiple">
      {landscapeItems.map((item) => (
        <AccordionItem key={item.value} value={item.value} variant={args.variant}>
          <AccordionTrigger text={item.title} />
          <AccordionContent>
            <CardHeader title={item.subtitle} subtitle={item.description} />
            <Image src={item.image} alt={item.title} scale="fill" />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};

export const WithIconsAccordion: Story = {
  args: {
    type: "single",
    collapsible: true,
    variant: "card",
    showIcons: true,
  },
  parameters: {
    docs: {
      description: {
        story: "An accordion displaying different categories of animals and wildlife.",
      },
    },
  },
  render: (args) => (
    <Accordion type={args.type} collapsible={args.collapsible}>
      {animalItems.map((item) => (
        <AccordionItem key={item.value} value={item.value} variant={args.variant}>
          <AccordionTrigger text={item.title} icon={item.icon} />
          <AccordionContent>
            <CardHeader
              title={item.subtitle}
              subtitle={item.description}
              actions={[<IconButton variant="tertiary" size="small" icon={item.icon} />]}
            />
            <Image src={item.image} alt={item.title} scale="fill" />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};
