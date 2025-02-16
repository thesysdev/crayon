import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../../Button";
import { Calendar } from "../../Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover";

const meta: Meta<typeof Popover> = {
  title: "Components/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const CalendarPopover: Story = {
  render: () => (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button>Pick a date</Button>
      </PopoverTrigger>
      <PopoverContent>
        
      </PopoverContent>
    </Popover>
  ),
};
