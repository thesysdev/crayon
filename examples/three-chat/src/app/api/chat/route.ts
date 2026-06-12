import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { openui3dSystemPrompt } from "@/openui3d/system-prompt";

export const runtime = "nodejs";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

const plainChatSystemPrompt = `You are the default OpenUI chat assistant.

Reply in concise plain text unless the user asks for 3D, Three.js, WebGL, shaders, meshes, physics, canvas scenes, walking, doors, GeoJSON, maps, terrain, GLB/GLTF, or point clouds.

Do not emit OpenUI Lang in this default mode. The application will route 3D requests to a separate OpenUI3D renderer.`;

function wants3D(messages: IncomingMessage[]): boolean {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  const text = lastUser?.content.toLowerCase() ?? "";
  return /\b(3d|three|webgl|shader|mesh|scene|canvas|cube|sphere|physics|rigid|bounce|collide|walk|door|geojson|geospatial|map|terrain|glb|gltf|point cloud|pointcloud|letter|text3d|drop|fall|falling|pile|stack|rapier)\b/.test(
    text,
  );
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error:
          "Missing ANTHROPIC_API_KEY. Add it to examples/three-chat/.env.local and restart the server.",
      },
      { status: 500 },
    );
  }

  const { messages } = (await req.json()) as { messages: IncomingMessage[] };
  const modelId = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const system = wants3D(messages) ? openui3dSystemPrompt : plainChatSystemPrompt;

  const result = streamText({
    model: anthropic(modelId),
    system,
    maxOutputTokens: 8192,
    messages: messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({
        role: message.role,
        content: message.content,
      })),
  });

  return result.toTextStreamResponse();
}
