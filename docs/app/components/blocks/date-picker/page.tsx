"use client";

import BlocksDocPage from "@components/blocks/_components/BlocksDocPage";
import { DatePicker } from "@openuidev/react-ui";

function DatePickerPreview() {
  return <DatePicker mode="single" style={{ width: "360px" }} />;
}

export default function BlocksDatePickerPage() {
  return (
    <BlocksDocPage
      title="Date picker"
      description="Preview for the Date picker block."
      preview={<DatePickerPreview />}
    />
  );
}
