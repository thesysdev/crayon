"use client";

import { OPENUI_CLOUD_UNAVAILABLE_MESSAGE } from "@/lib/openui-cloud/errors";
import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import { defineArtifactCategories, type ChatStorage } from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../../chat-page.module.css";
import type { ChatLifecycleState } from "../chat-types";
import { ChatLifecycleBridge } from "./chat-lifecycle-bridge";
import { createCloudChatLLM } from "./cloud-chat-llm";
import { CloudModelSwitcher } from "./cloud-model-switcher";

const { artifactRenderers, artifactCategories } = defineArtifactCategories([
  { name: "Presentations", renderers: [presentationArtifactRenderer] },
  { name: "Reports", renderers: [reportArtifactRenderer] },
]);

const CLOUD_STARTERS = [
  {
    displayText: "Summarize EV trends",
    prompt: "In a few sentences, summarize the biggest EV market trends this quarter.",
  },
  {
    displayText: "Pricing strategy tips",
    prompt: "List five quick tips for pricing a new electric vehicle competitively.",
  },
  {
    displayText: "Quarterly deck",
    prompt: "Create a short presentation about our Q2 results with three slides.",
  },
  {
    displayText: "Market report",
    prompt: "Write a brief market-analysis report on the EV sector.",
  },
];

interface CloudAgentSurfaceProps {
  themeMode: "light" | "dark";
  onLifecycleChange: (state: ChatLifecycleState) => void;
  onUnavailable: () => void;
}

export function CloudAgentSurface({
  themeMode,
  onLifecycleChange,
  onUnavailable,
}: CloudAgentSurfaceProps) {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [llm] = useState(() => createCloudChatLLM(onUnavailable));
  const cloudFetch = useMemo<typeof fetch>(() => {
    return async (input, init) => {
      if (typeof input !== "string" || input !== "/api/openui-cloud/frontend-token") {
        return fetch(input, init);
      }

      if (!navigator.locks) {
        onUnavailable();
        return new Response(null, { status: 503 });
      }

      return navigator.locks.request("openui-cloud-session-bootstrap", () => fetch(input, init));
    };
  }, [onUnavailable]);
  const cloudStorage = useOpenuiCloudStorage({
    token: "/api/openui-cloud/frontend-token",
    apiBaseUrl: "https://api.thesys.dev",
    features: { artifact: true },
    fetch: cloudFetch,
  });
  const storage = useMemo(
    () => guardCloudStorage(cloudStorage, onUnavailable),
    [cloudStorage, onUnavailable],
  );

  useEffect(() => {
    llm.setSelectedModel(selectedModel);
  }, [llm, selectedModel]);

  const handleModelChange = useCallback(
    (model: string) => {
      llm.setSelectedModel(model);
      setSelectedModel(model);
    },
    [llm],
  );

  return (
    <div className="chat-agent-surface" data-chat-mode="cloud">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={chatLibrary}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
        agentName="OpenUI Cloud"
        scrollVariant="always"
        scrollOnLoad={false}
        theme={{ mode: themeMode }}
        starterVariant="short"
        starters={CLOUD_STARTERS}
      >
        <AgentInterface.MobileHeader
          className={styles.cloudMobileHeader}
          agentName=""
          actions={
            <CloudModelSwitcher selectedModel={selectedModel} onModelChange={handleModelChange} />
          }
        />
        <AgentInterface.ThreadHeader className={styles.cloudThreadHeader}>
          <CloudModelSwitcher selectedModel={selectedModel} onModelChange={handleModelChange} />
        </AgentInterface.ThreadHeader>
        <AgentInterface.Welcome
          title="Build with OpenUI Cloud"
          description="Create managed generative interfaces, reports, and presentations."
        />
        <ChatLifecycleBridge onChange={onLifecycleChange} onError={onUnavailable} />
      </AgentInterface>
    </div>
  );
}

function guardCloudStorage(storage: ChatStorage, onUnavailable: () => void): ChatStorage {
  const artifact = storage.artifact;

  async function guard<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch {
      onUnavailable();
      throw new Error(OPENUI_CLOUD_UNAVAILABLE_MESSAGE);
    }
  }

  return {
    ...storage,
    thread: {
      listThreads: (cursor) => guard(() => storage.thread.listThreads(cursor)),
      createThread: (firstMessage) => guard(() => storage.thread.createThread(firstMessage)),
      getMessages: (threadId) => guard(() => storage.thread.getMessages(threadId)),
      updateThread: (thread) => guard(() => storage.thread.updateThread(thread)),
      deleteThread: (threadId) => guard(() => storage.thread.deleteThread(threadId)),
    },
    ...(artifact
      ? {
          artifact: {
            list: (params) => guard(() => artifact.list(params)),
            get: (id) => guard(() => artifact.get(id)),
            update: (patch) => guard(() => artifact.update(patch)),
          },
        }
      : {}),
  };
}
