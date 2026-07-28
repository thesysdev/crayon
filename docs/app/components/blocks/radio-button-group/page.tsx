"use client";

import BlocksDocPage from "@components/blocks/_components/BlocksDocPage";
import { RadioGroup } from "@openuidev/react-ui/RadioGroup";
import { RadioItem } from "@openuidev/react-ui/RadioItem";

function RadioButtonGroupPreview() {
  return (
    <RadioGroup variant="card">
      <RadioItem value="starter" label="Starter" description="For personal use" />
      <RadioItem value="pro" label="Pro" description="For growing teams" />
      <RadioItem value="enterprise" label="Enterprise" description="For large organizations" />
    </RadioGroup>
  );
}

export default function BlocksRadioButtonGroupPage() {
  return (
    <BlocksDocPage
      title="Radio button group"
      description="Preview for the Radio button group block."
      preview={<RadioButtonGroupPreview />}
    />
  );
}
