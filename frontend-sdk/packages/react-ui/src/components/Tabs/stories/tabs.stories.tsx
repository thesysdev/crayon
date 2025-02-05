import type { Meta, StoryObj } from "@storybook/react";
import { Bell, Settings, ShieldCheck, UserRound } from "lucide-react";
import { Header } from "../../Header";
import "../../Header/header.scss";
import { IconButton } from "../../IconButton";
import "../../IconButton/iconButton.scss";
import { Image } from "../../Image";
import "../../Image/image.scss";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Tabs";
import "../tabs.scss";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
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
        defaultValue: { summary: "undefined" },
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
        <TabsTrigger value="tab1" text="Account" />
        <TabsTrigger value="tab2" text="Password" />
        <TabsTrigger value="tab3" text="Settings" />
      </TabsList>
      <TabsContent value="tab1">
        <Header
          title="Title"
          subtitle="Subtitle"
          actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
        />
        <Image src="https://picsum.photos/700/700" alt="Image" scale="fill" />
      </TabsContent>
      <TabsContent value="tab2">
        <Header
          title="Title"
          subtitle="Subtitle"
          actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
        />
        <Image src="https://picsum.photos/700/750" alt="Image" scale="fill" />
      </TabsContent>
      <TabsContent value="tab3">
        <Header
          title="Title"
          subtitle="Subtitle"
          actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
        />
        <Image src="https://picsum.photos/700/760" alt="Image" scale="fill" />
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
        <TabsTrigger value="tab1" text="Account" icon={<UserRound />} />
        <TabsTrigger value="tab2" text="Password" icon={<ShieldCheck />} />
        <TabsTrigger value="tab3" text="Settings" icon={<Settings />} />
      </TabsList>
      <TabsContent value="tab1">
        <Header
          title="Title"
          subtitle="Subtitle"
          actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
        />
        <Image src="https://picsum.photos/200/300" alt="Image" scale="fill" />
      </TabsContent>
      <TabsContent value="tab2">
        <Header
          title="Title"
          subtitle="Subtitle"
          actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
        />
        <Image src="https://picsum.photos/300/400" alt="Image" scale="fill" />
      </TabsContent>
      <TabsContent value="tab3">
        <Header
          title="Title"
          subtitle="Subtitle"
          actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
        />
        <Image src="https://picsum.photos/400/500" alt="Image" scale="fill" />
      </TabsContent>
    </Tabs>
  ),
};
