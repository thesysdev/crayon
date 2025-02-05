import type { Meta, StoryObj } from "@storybook/react";
import { Bell, Download } from "lucide-react";
import { CardHeader } from "../../CardHeader";
import "../../CardHeader/cardHeader.scss";
import { IconButton } from "../../IconButton";
import "../../IconButton/iconButton.scss";
import { Image } from "../../Image";
import "../../Image/image.scss";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../Accordion";
import "../accordion.scss";

interface AccordionStoryProps {
  type: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string;
  variant?: "card" | "sunk";
  showIcons?: boolean;
}

const meta: Meta<AccordionStoryProps> = {
  title: "Components/Accordion",
  component: Accordion as any, // Type casting needed since we're using a custom props interface
  tags: ["autodocs", "!dev"],
  parameters: {
    layout: "centered",
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
    },
    collapsible: {
      control: "boolean",
      description: "Whether the accordion items can be collapsed (only available for single type)",
      defaultValue: true,
      if: { arg: "type", eq: "single" },
    },
    defaultValue: {
      description: 'The default opened item value (only for type="single")',
      control: false,
    },
    variant: {
      control: "radio",
      options: ["card", "sunk"],
      description: "The visual style variant of the accordion",
      defaultValue: "card",
    },
    showIcons: {
      control: "boolean",
      description: "Whether to show icons in the accordion triggers",
      defaultValue: false,
    },
  },
};

export default meta;
type Story = StoryObj<AccordionStoryProps>;

export const Single: Story = {
  render: (args) => {
    const items = [
      {
        value: "item-1",
        title: "Accordion 1",
        imageId: "600",
      },
      {
        value: "item-2",
        title: "Accordion 2",
        imageId: "700",
      },
      {
        value: "item-3",
        title: "Accordion 3",
        imageId: "900",
      },
    ];

    const AccordionComponent =
      args.type === "single" ? (
        <Accordion type="single" collapsible={args.collapsible} defaultValue={args.defaultValue}>
          {items.map((item) => (
            <AccordionItem key={item.value} value={item.value} variant={args.variant}>
              <AccordionTrigger
                text={item.title}
                icon={args.showIcons ? <Download /> : undefined}
              />
              <AccordionContent>
                <CardHeader
                  title="Title"
                  subtitle="Subtitle"
                  actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
                />
                <Image src={`https://picsum.photos/400/${item.imageId}`} alt="Image" scale="fill" />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Accordion type="multiple">
          {items.map((item) => (
            <AccordionItem key={item.value} value={item.value} variant={args.variant}>
              <AccordionTrigger
                text={item.title}
                icon={args.showIcons ? <Download /> : undefined}
              />
              <AccordionContent>
                <CardHeader
                  title="Title"
                  subtitle="Subtitle"
                  actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
                />
                <Image src={`https://picsum.photos/400/${item.imageId}`} alt="Image" scale="fill" />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );

    return AccordionComponent;
  },
  args: {
    type: "single",
    collapsible: true,
    variant: "card",
    showIcons: false,
  },
};

export const Multiple: Story = {
  args: {
    type: "multiple",
  },
  parameters: {
    docs: {
      description: {
        story:
          "An example of an Accordion that allows multiple items to be open simultaneously. This variant gives users the flexibility to view multiple content sections at once.",
      },
    },
  },
  render: (args) => (
    <Accordion type={args.type}>
      <AccordionItem value="item-1">
        <AccordionTrigger text="Accordion 1" />
        <AccordionContent>
          <CardHeader
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/200/300" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger text="Accordion 2" />
        <AccordionContent>
          <CardHeader
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/300/400" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger text="Accordion 3" />
        <AccordionContent>
          <CardHeader
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/400/500" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const withIcon: Story = {
  args: {
    type: "single",
    collapsible: true,
    showIcons: true,
  },
  render: (args) => (
    <Accordion type={args.type} collapsible={args.collapsible}>
      <AccordionItem value="item-1">
        <AccordionTrigger text="Accordion 1" icon={<Download />} />
        <AccordionContent>
          <CardHeader
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/200/300" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger text="Accordion 2" icon={<Download />} />
        <AccordionContent>
          <CardHeader
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/300/400" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger text="Accordion 3" icon={<Download />} />
        <AccordionContent>
          <CardHeader
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/400/500" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const CardVariant: Story = {
  args: {
    type: "single",
    collapsible: true,
    variant: "card",
  },
  render: (args) => (
    <Accordion type={args.type} collapsible={args.collapsible}>
      <AccordionItem value="item-1" variant={args.variant}>
        <AccordionTrigger text="Accordion 1" />
        <AccordionContent>
          <CardHeader
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/200/300" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" variant={args.variant}>
        <AccordionTrigger text="Accordion 2" />
        <AccordionContent>
          <CardHeader
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/300/400" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" variant={args.variant}>
        <AccordionTrigger text="Accordion 3" />
        <AccordionContent>
          <CardHeader
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/400/500" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const SunkVariant: Story = {
  args: {
    type: "single",
    collapsible: true,
    variant: "sunk",
  },
  render: (args) => (
    <Accordion type={args.type} collapsible={args.collapsible}>
      <AccordionItem value="item-1" variant={args.variant}>
        <AccordionTrigger text="Accordion 1" />
        <AccordionContent>
          <CardHeader
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/200/300" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" variant={args.variant}>
        <AccordionTrigger text="Accordion 2" />
        <AccordionContent>
          <CardHeader
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/300/400" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" variant={args.variant}>
        <AccordionTrigger text="Accordion 3" />
        <AccordionContent>
          <CardHeader
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/400/500" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
