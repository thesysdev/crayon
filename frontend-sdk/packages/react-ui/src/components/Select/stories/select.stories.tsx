import type { Meta } from "@storybook/react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../Select";
import "../select.scss";

type SelectProps = React.ComponentProps<typeof Select | typeof SelectTrigger>;

const meta: Meta<SelectProps> = {
  title: "Components/Select",
  args: {
    size: "lg",
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["lg", "md", "sm"],
    },
  },
  tags: ["autodocs"],
};

export default meta;

export const SelectDemo = (args: any) => {
  return (
    <Select>
      <SelectTrigger style={{ width: "228px" }} size={args.size}>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          {/* Use SelectLabel to label the group of options  */}
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="grapes">Grapes</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
          <SelectSeparator />
          <SelectLabel>Fast Food</SelectLabel>
          {/* Use SelectLabel to label the group of options  */}
          <SelectItem value="burger">Burger</SelectItem>
          <SelectItem value="pizza">Pizza</SelectItem>
          <SelectItem value="pasta">Pasta</SelectItem>
          <SelectItem value="salad">Salad</SelectItem>
          <SelectItem value="ice-cream">Ice Cream</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
