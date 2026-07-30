import type { NextRequest } from "next/server";
import { handleChatCompletions } from "../_lib/chat-completions-handler";

export function POST(request: NextRequest) {
  return handleChatCompletions(request, "chat-oss", "openui");
}
