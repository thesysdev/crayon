import { handleFrontendToken } from "../_lib/frontend-token-handler";

export function POST(request: Request) {
  return handleFrontendToken(request, "chat-cloud");
}
