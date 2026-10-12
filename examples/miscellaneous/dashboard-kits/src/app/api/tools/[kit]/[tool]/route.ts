import { runTool } from "../../../../../kits/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ kit: string; tool: string }> },
) {
  const { kit, tool } = await params;
  try {
    const args = await request.json().catch(() => ({}));
    return Response.json(runTool(kit, tool, args));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
