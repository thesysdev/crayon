import type { Meta, StoryObj } from "@storybook/react";
import { BusFront, PlaneTakeoff, Ship } from "lucide-react";
import { CardHeader } from "../../CardHeader";
import { IconButton } from "../../IconButton";
import { Image } from "../../Image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Tabs";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["!dev", "autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "400px", margin: "2rem" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: {
        type: "select",
        options: ["clear", "card", "sunk"],
      },
      description: "The variant of the tabs",
      table: {
        type: {
          summary: "clear | card | sunk",
        },
        defaultValue: { summary: "clear" },
        category: "Appearance",
      },
    },
    defaultValue: {
      control: false,
      description: "The default value of the tabs which is used to determine which tab is selected",
      table: {
        category: "Behavior",
      },
    },
    className: {
      control: false,
      description: "Additional class name for the tabs",
      table: {
        category: "Styling",
      },
    },
    style: {
      control: false,
      description: "Additional style for the tabs",
      table: {
        category: "Styling",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  args: {
    variant: "clear",
    defaultValue: "tab1",
  },
  render: (args) => (
    <Tabs {...args}>
      <TabsList>
        <TabsTrigger value="tab1" text="Paris" />
        <TabsTrigger value="tab2" text="Tokyo" />
        <TabsTrigger value="tab3" text="New York" />
      </TabsList>
      <TabsContent value="tab1">
        <CardHeader
          title="Paris, France"
          subtitle="The City of Light"
          actions={[<IconButton variant="tertiary" size="small" icon={<PlaneTakeoff />} />]}
        />
        <Image
          src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34"
          alt="Eiffel Tower in Paris"
          scale="fill"
        />
      </TabsContent>
      <TabsContent value="tab2">
        <CardHeader
          title="Tokyo, Japan"
          subtitle="Where Tradition Meets Future"
          actions={[<IconButton variant="tertiary" size="small" icon={<Ship />} />]}
        />
        <Image
          src="https://images.unsplash.com/photo-1536098561742-ca998e48cbcc"
          alt="Tokyo cityscape with Mount Fuji"
          scale="fill"
        />
      </TabsContent>
      <TabsContent value="tab3">
        <CardHeader
          title="New York City, USA"
          subtitle="The City That Never Sleeps"
          actions={[<IconButton variant="tertiary" size="small" icon={<BusFront />} />]}
        />
        <Image
          src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9"
          alt="New York City skyline"
          scale="fill"
        />
      </TabsContent>
    </Tabs>
  ),
};

export const WithIcon: Story = {
  args: {
    variant: "clear",
    defaultValue: "tab2",
  },
  render: (args) => (
    <Tabs {...args}>
      <TabsList>
        <TabsTrigger value="tab1" text="Venice" icon={<PlaneTakeoff />} />
        <TabsTrigger value="tab2" text="Kyoto" icon={<Ship />} />
        <TabsTrigger value="tab3" text="Dubai" icon={<BusFront />} />
        <TabsTrigger value="tab1" text="Venice" icon={<PlaneTakeoff />} />
        <TabsTrigger value="tab2" text="Kyoto" icon={<Ship />} />
        <TabsTrigger value="tab3" text="Dubai" icon={<BusFront />} />
        <TabsTrigger value="tab1" text="Venice" icon={<PlaneTakeoff />} />
        <TabsTrigger value="tab2" text="Kyoto" icon={<Ship />} />
        <TabsTrigger value="tab3" text="Dubai" icon={<BusFront />} />
        <TabsTrigger value="tab1" text="Venice" icon={<PlaneTakeoff />} />
        <TabsTrigger value="tab2" text="Kyoto" icon={<Ship />} />
        <TabsTrigger value="tab3" text="Dubai" icon={<BusFront />} />
      </TabsList>
      <TabsContent value="tab1">
        <CardHeader
          title="Venice, Italy"
          subtitle="The Floating City"
          actions={[<IconButton variant="tertiary" size="small" icon={<PlaneTakeoff />} />]}
        />
        <Image
          src="https://images.unsplash.com/photo-1514890547357-a9ee288728e0"
          alt="Venice canals and gondolas"
          scale="fill"
        />
      </TabsContent>
      <TabsContent value="tab2">
        <CardHeader
          title="Kyoto, Japan"
          subtitle="The Cultural Heart of Japan"
          actions={[<IconButton variant="tertiary" size="small" icon={<Ship />} />]}
        />
        <Image
          src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e"
          alt="Traditional temple in Kyoto"
          scale="fill"
        />
      </TabsContent>
      <TabsContent value="tab3">
        <CardHeader
          title="Dubai, UAE"
          subtitle="City of the Future"
          actions={[<IconButton variant="tertiary" size="small" icon={<BusFront />} />]}
        />
        <Image
          src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c"
          alt="Dubai skyline"
          scale="fill"
        />
      </TabsContent>
    </Tabs>
  ),
};
