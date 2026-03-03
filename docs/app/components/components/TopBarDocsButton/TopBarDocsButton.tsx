"use client";

import { useRouter } from "next/navigation";
import { Button } from "@openuidev/react-ui/Button";

export default function TopBarDocsButton() {
  const router = useRouter();

  return (
    <Button variant="primary" size="small" onClick={() => router.push("/components/blocks")}>
      Docs
    </Button>
  );
}
