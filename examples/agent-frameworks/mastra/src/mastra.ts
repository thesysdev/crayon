import { Agent } from "@mastra/core/agent";
import { Mastra } from "@mastra/core";
import { generateSystemPrompt } from "@openuidev/thesys-server";
import { OpenUICloudGateway, openuiCloudModelId } from "@/openui-cloud-gateway";
import { getStockPrice, getWeather } from "@/tools";

export const openuiAgent = new Agent({
  id: "openui-mastra-agent",
  name: "OpenUI x Mastra Agent",
  instructions: generateSystemPrompt({
    instructions:
      "You are a helpful assistant. Use tools when relevant and help the user with their requests. Always format your responses cleanly.",
  }),
  model: { id: openuiCloudModelId },
  tools: { getWeather, getStockPrice },
});

export const mastra = new Mastra({
  gateways: {
    openuiCloud: new OpenUICloudGateway(),
  },
  agents: {
    openui: openuiAgent,
  },
});
