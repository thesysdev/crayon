"use client";

import BlocksDocPage from "@components/blocks/_components/BlocksDocPage";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@openuidev/react-ui";

function SelectPreview() {
  return (
    <div style={{ width: "240px" }}>
      <Select>
        <SelectTrigger size="md">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="grapes">Grapes</SelectItem>
            <SelectSeparator />
            <SelectLabel>Fast Food</SelectLabel>
            <SelectItem value="burger">Burger</SelectItem>
            <SelectItem value="pizza">Pizza</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function BlocksSelectPage() {
  return (
    <BlocksDocPage
      title="Select"
      description="Preview for the Select block."
      preview={<SelectPreview />}
    />
  );
}
