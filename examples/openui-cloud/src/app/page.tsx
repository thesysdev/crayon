import "@openuidev/react-ui/components.css";
import "@openuidev/thesys/styles.css";

import { CloudChat } from "@/components/cloud-chat";

// The chat surface is client-only (browser storage + fct_ token minting on
// mount). Rendering it dynamically keeps Turbopack from statically prerendering
// the heavy artifact-renderer SSR chunk at build time.
export const dynamic = "force-dynamic";

export default function Page() {
  return <CloudChat />;
}
