import { toToolSpec } from "@openuidev/dashboard-kits/server";
import { getKit } from "../../../kits";
import { buildSystemPrompt } from "../../../kits/server";

/** The system prompt a kit sends to the model, for inspection in the Prompt view. */
export async function GET(request: Request) {
  const kit = getKit(new URL(request.url).searchParams.get("kit") ?? "");
  if (!kit) return Response.json({ error: "Unknown kit" }, { status: 404 });
  return Response.json({
    prompt: buildSystemPrompt(kit),
    tools: kit.tools.map(toToolSpec),
  });
}
