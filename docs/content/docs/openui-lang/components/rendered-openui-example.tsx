"use client";

import { Renderer } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

export function RenderedOpenUIExample({ response }: { response: string }) {
  return <Renderer library={openuiLibrary} response={response} isStreaming={false} />;
}
