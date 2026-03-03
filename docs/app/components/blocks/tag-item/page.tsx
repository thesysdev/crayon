"use client";

import BlocksDocPage from "@components/blocks/_components/BlocksDocPage";
import { Tag } from "@openuidev/react-ui";

function TagItemPreview() {
  const tags = [
    { text: "Design", variant: "info" as const },
    { text: "Docs", variant: "neutral" as const },
    { text: "Released", variant: "success" as const },
  ];

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {tags.map((tag) => (
        <Tag key={tag.text} text={tag.text} variant={tag.variant} />
      ))}
    </div>
  );
}

export default function BlocksTagItemPage() {
  return (
    <BlocksDocPage
      title="Tag item"
      description="Displays compact status, category labels or key attributes."
      preview={<TagItemPreview />}
    />
  );
}
