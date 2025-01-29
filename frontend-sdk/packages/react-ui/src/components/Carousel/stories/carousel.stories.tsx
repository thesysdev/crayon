import type { Meta, StoryObj } from "@storybook/react";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "../../Header";
import "../../Header/header.scss";
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

const meta: Meta<typeof Carousel> = {
  title: "Components/Carousel",
  component: Carousel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Carousel>;

export const Default: Story = {
  render: () => (
    <Carousel style={{ width: "100%", maxWidth: "20rem" }}>
      <CarouselContent>
        {Array.from({ length: 10 }).map((_, index) => (
          <CarouselItem key={index}>
            <Header
              title="Title"
              subtitle="Subtitle"
              actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
            />
            <Image src="https://picsum.photos/200/300" alt="Image" scale="fill" />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious icon={<ChevronLeft />} />
      <CarouselNext icon={<ChevronRight />} />
    </Carousel>
  ),
};

export const MultipleItems: Story = {
  render: () => (
    <Carousel style={{ width: "100%", maxWidth: "28rem" }} itemsToScroll={2}>
      <CarouselContent>
        {Array.from({ length: 10 }).map((_, index) => (
          <CarouselItem key={index}>
            <Header
              title="Title"
              subtitle="Subtitle"
              actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
            />
            <Image src="https://picsum.photos/200/300" alt="Image" scale="fill" />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious icon={<ChevronLeft />} />
      <CarouselNext icon={<ChevronRight />} />
    </Carousel>
  ),
};

export const WithWrappingDiv: Story = {
  render: () => (
    <Carousel style={{ width: "100%", maxWidth: "28rem" }} hasWrappingDivForCards>
      <CarouselContent>
        <div style={{ display: "flex" }}>
          {Array.from({ length: 20 }).map((_, index) => (
            <CarouselItem key={index}>
              <Header
                title="Title"
                subtitle="Subtitle"
                actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
              />
              <Image src="https://picsum.photos/200/300" alt="Image" scale="fill" />
            </CarouselItem>
          ))}
        </div>
      </CarouselContent>
      <CarouselPrevious icon={<ChevronLeft />} />
      <CarouselNext icon={<ChevronRight />} />
    </Carousel>
  ),
};

export const WithNoButtons: Story = {
  render: () => (
    <Carousel style={{ width: "100%", maxWidth: "28rem" }} showButtons={false}>
      <CarouselContent style={{ gap: "1rem" }}>
        {Array.from({ length: 10 }).map((_, index) => (
          <CarouselItem key={index}>
            <Header
              title="Title"
              subtitle="Subtitle"
              actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
            />
            <Image src="https://picsum.photos/200/300" alt="Image" scale="fill" />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious icon={<ChevronLeft />} />
      <CarouselNext icon={<ChevronRight />} />
    </Carousel>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <Carousel style={{ width: "100%", maxWidth: "28rem" }}>
      <CarouselContent style={{ gap: "1rem" }}>
        {Array.from({ length: 10 }).map((_, index) => (
          <CarouselItem key={index}>
            <Header
              title="Title"
              subtitle="Subtitle"
              actions={[<IconButton variant="tertiary" size="small" icon={<Bell />} />]}
            />
            <Image src="https://picsum.photos/200/300" alt="Image" scale="fill" />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious icon={<ChevronLeft />} />
      <CarouselNext icon={<ChevronRight />} />
    </Carousel>
  ),
};
