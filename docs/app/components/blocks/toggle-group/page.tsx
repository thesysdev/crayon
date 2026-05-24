"use client";

import BlocksDocPage from "@components/blocks/_components/BlocksDocPage";
import { SwitchGroup, SwitchItem } from "@openuidev/react-ui";

function ToggleGroupPreview() {
  return (
    <SwitchGroup variant="card">
      <SwitchItem value="left" label="Left align" description="Align content to the left" />
      <SwitchItem value="center" label="Center align" description="Align content to the center" />
      <SwitchItem value="right" label="Right align" description="Align content to the right" />
    </SwitchGroup>
  );
}

export default function BlocksToggleGroupPage() {
  return (
    <BlocksDocPage
      title="Toggle group"
      description="Preview for the Toggle group block."
      preview={<ToggleGroupPreview />}
    />
  );
}
