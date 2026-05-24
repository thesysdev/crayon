"use client";

import BlocksDocPage from "@components/blocks/_components/BlocksDocPage";
import { Input } from "@openuidev/react-ui";

function InputFieldPreview() {
  return <Input size="medium" placeholder="Enter text..." />;
}

export default function BlocksInputFieldPage() {
  return (
    <BlocksDocPage
      title="Input field"
      description="Preview for the Input field block."
      preview={<InputFieldPreview />}
    />
  );
}
