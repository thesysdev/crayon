import type { Meta, StoryObj } from "@storybook/react";
import { BusFront, PlaneTakeoff, Ship } from "lucide-react";
import { Card } from "../../Card/Card";
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
          "```tsx\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from '@openui-ui/react-ui';\n```",
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
        options: ["clear"],
      },
      description: "The variant of the tabs",
      table: {
        type: {
          summary: "clear",
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

export const Title: Story = {
  args: {
    variant: "clear",
    defaultValue: "tab1",
  },
  render: (args) => (
    <Card>
      <Tabs {...args}>
        <TabsList variant="title">
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
    </Card>
  ),
};

export const IconTitle: Story = {
  args: {
    variant: "clear",
    defaultValue: "tab1",
  },
  render: (args) => (
    <Tabs {...args}>
      <TabsList variant="iconTitle">
        <TabsTrigger value="tab1" text="Venice" icon={<PlaneTakeoff />} />
        <TabsTrigger value="tab2" text="Kyoto" icon={<Ship />} />
        <TabsTrigger value="tab3" text="Dubai" icon={<BusFront />} />
      </TabsList>
      <TabsContent value="tab1">
        <CardHeader title="Venice, Italy" subtitle="The Floating City" />
      </TabsContent>
      <TabsContent value="tab2">
        <CardHeader title="Kyoto, Japan" subtitle="The Cultural Heart of Japan" />
      </TabsContent>
      <TabsContent value="tab3">
        <CardHeader title="Dubai, UAE" subtitle="City of the Future" />
      </TabsContent>
    </Tabs>
  ),
};

export const IconTitleSubtext: Story = {
  args: {
    variant: "clear",
    defaultValue: "tab1",
  },
  render: (args) => (
    <Tabs {...args}>
      <TabsList variant="iconTitleSubtext">
        <TabsTrigger value="tab1" text="Venice" subtext="Italy" icon={<PlaneTakeoff />} />
        <TabsTrigger value="tab2" text="Kyoto" subtext="Japan" icon={<Ship />} />
        <TabsTrigger value="tab3" text="Dubai" subtext="UAE" icon={<BusFront />} />
      </TabsList>
      <TabsContent value="tab1">
        <CardHeader title="Venice, Italy" subtitle="The Floating City" />
      </TabsContent>
      <TabsContent value="tab2">
        <CardHeader title="Kyoto, Japan" subtitle="The Cultural Heart of Japan" />
      </TabsContent>
      <TabsContent value="tab3">
        <CardHeader title="Dubai, UAE" subtitle="City of the Future" />
      </TabsContent>
    </Tabs>
  ),
};

export const ImageTitle: Story = {
  args: {
    variant: "clear",
    defaultValue: "tab1",
  },
  render: (args) => (
    <Tabs {...args}>
      <TabsList variant="imageTitle">
        <TabsTrigger
          value="tab1"
          text="Paris"
          image="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=64"
        />
        <TabsTrigger
          value="tab2"
          text="Tokyo"
          image="https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=64"
        />
        <TabsTrigger
          value="tab3"
          text="New York"
          image="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=64"
        />
      </TabsList>
      <TabsContent value="tab1">
        <CardHeader title="Paris, France" subtitle="The City of Light" />
      </TabsContent>
      <TabsContent value="tab2">
        <CardHeader title="Tokyo, Japan" subtitle="Where Tradition Meets Future" />
      </TabsContent>
      <TabsContent value="tab3">
        <CardHeader title="New York City, USA" subtitle="The City That Never Sleeps" />
      </TabsContent>
    </Tabs>
  ),
};

export const ImageTitleSubtext: Story = {
  args: {
    variant: "clear",
    defaultValue: "tab1",
  },
  render: (args) => (
    <Tabs {...args}>
      <TabsList variant="imageTitleSubtext">
        <TabsTrigger
          value="tab1"
          text="Paris"
          subtext="France"
          image="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=64"
        />
        <TabsTrigger
          value="tab2"
          text="Tokyo"
          subtext="Japan"
          image="https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=64"
        />
        <TabsTrigger
          value="tab3"
          text="New York"
          subtext="USA"
          image="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=64"
        />
        <TabsTrigger
          value="tab4"
          text="London"
          subtext="UK"
          image="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=64"
        />
        <TabsTrigger
          value="tab5"
          text="Sydney"
          subtext="Australia"
          image="https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=64"
        />
        <TabsTrigger
          value="tab6"
          text="Rome"
          subtext="Italy"
          image="https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=64"
        />
        <TabsTrigger
          value="tab7"
          text="Barcelona"
          subtext="Spain"
          image="https://images.unsplash.com/photo-1583422409516-2895a77efded?w=64"
        />
        <TabsTrigger
          value="tab8"
          text="Bangkok"
          subtext="Thailand"
          image="https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=64"
        />
        <TabsTrigger
          value="tab9"
          text="Cape Town"
          subtext="South Africa"
          image="https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=64"
        />
        <TabsTrigger
          value="tab10"
          text="Amsterdam"
          subtext="Netherlands"
          image="https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=64"
        />
      </TabsList>
      <TabsContent value="tab1">
        <CardHeader title="Paris, France" subtitle="The City of Light" />
      </TabsContent>
      <TabsContent value="tab2">
        <CardHeader title="Tokyo, Japan" subtitle="Where Tradition Meets Future" />
      </TabsContent>
      <TabsContent value="tab3">
        <CardHeader title="New York City, USA" subtitle="The City That Never Sleeps" />
      </TabsContent>
      <TabsContent value="tab4">
        <CardHeader title="London, UK" subtitle="The City of History" />
      </TabsContent>
      <TabsContent value="tab5">
        <CardHeader title="Sydney, Australia" subtitle="The Harbour City" />
      </TabsContent>
      <TabsContent value="tab6">
        <CardHeader title="Rome, Italy" subtitle="The Eternal City" />
      </TabsContent>
      <TabsContent value="tab7">
        <CardHeader title="Barcelona, Spain" subtitle="City of Gaudí" />
      </TabsContent>
      <TabsContent value="tab8">
        <CardHeader title="Bangkok, Thailand" subtitle="City of Angels" />
      </TabsContent>
      <TabsContent value="tab9">
        <CardHeader title="Cape Town, South Africa" subtitle="The Mother City" />
      </TabsContent>
      <TabsContent value="tab10">
        <CardHeader title="Amsterdam, Netherlands" subtitle="Venice of the North" />
      </TabsContent>
    </Tabs>
  ),
};
