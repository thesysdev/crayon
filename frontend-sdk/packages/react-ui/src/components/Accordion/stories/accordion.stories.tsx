import type { Meta, StoryObj } from "@storybook/react";
import { Bell, Download } from "lucide-react";
import { Header } from "../../Header";
import "../../Header/header.scss";
import { IconButton } from "../../IconButton";
import "../../IconButton/iconButton.scss";
import { Image } from "../../Image";
import "../../Image/image.scss";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../Accordion";
import "../accordion.scss";

const meta: Meta<typeof Accordion> = {
  title: "Components/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  decorators: [(Story) => <Story />],
};
export default meta;

type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger text="Accordion 1" />
        <AccordionContent>
          <Header
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
          <Header
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
          <Header
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

export const SingleOpen: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger text="Accordion 1" />
        <AccordionContent>
          <Header
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
          <Header
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
          <Header
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

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple">
      <AccordionItem value="item-1">
        <AccordionTrigger text="Accordion 1" />
        <AccordionContent>
          <Header
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
          <Header
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
          <Header
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

export const MultipleOpen: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={["item-1", "item-2"]}>
      <AccordionItem value="item-1">
        <AccordionTrigger text="Accordion 1" />
        <AccordionContent>
          <Header
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
          <Header
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
          <Header
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
  render: () => (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger text="Accordion 1" icon={<Download />} />
        <AccordionContent>
          <Header
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
          <Header
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
          <Header
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
  render: () => (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1" variant="card">
        <AccordionTrigger text="Accordion 1" />
        <AccordionContent>
          <Header
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/200/300" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" variant="card">
        <AccordionTrigger text="Accordion 2" />
        <AccordionContent>
          <Header
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/300/400" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" variant="card">
        <AccordionTrigger text="Accordion 3" />
        <AccordionContent>
          <Header
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
  render: () => (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1" variant="sunk">
        <AccordionTrigger text="Accordion 1" />
        <AccordionContent>
          <Header
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/200/300" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" variant="sunk">
        <AccordionTrigger text="Accordion 2" />
        <AccordionContent>
          <Header
            title="Title"
            subtitle="Subtitle"
            actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
          />
          <Image src="https://picsum.photos/300/400" alt="Image" scale="fill" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" variant="sunk">
        <AccordionTrigger text="Accordion 3" />
        <AccordionContent>
          <Header
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
