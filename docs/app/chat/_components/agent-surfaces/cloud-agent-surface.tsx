"use client";

import {
  OPENUI_CLOUD_LOGO_URL,
  OPENUI_CLOUD_PROMPT_TEMPLATES,
  OPENUI_CLOUD_STARTERS,
} from "@/lib/openui-cloud/chat-constants";
import { createCloudChatLLM } from "@/lib/openui-cloud/chat-llm";
import { CLOUD_USER_ID_HEADER, getOrCreateCloudUserId } from "@/lib/openui-cloud/user-id";
import { AgentInterface, defineArtifactCategories } from "@openuidev/react-ui";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";
import { FileText, Presentation } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../../chat-page.module.css";
import {
  DemoAwareComposer,
  DemoAwareModelSwitcher,
  DemoPathSynchronizer,
} from "../demo-aware-chat-controls";
import { DemoConversationList } from "../demo-conversation-list";
import { createDemoConversationStorage } from "../demo-conversation-storage";
import { DemoForkRegistry } from "../demo-fork-registry";
import { SidebarUpgradeFooter } from "../sidebar-upgrade-sheet";
import { getPersistedCloudModel, usePersistedCloudModel } from "../use-persisted-cloud-model";

// Blue-to-pink spectrum colors for the stock-comparison demo's line chart,
// matching the OpenUI Cloud default chart look while keeping every series
// clearly distinguishable. In series order: META light periwinkle, MSFT dark
// indigo, NFLX saturated pink, GOOGL deep raspberry, S&P 500 gray.
// The chart distributes palette colors starting from the middle of the array
// (see getDistributedColors in @openuidev/react-ui); with five series and five
// colors the slots resolve back to identity order.
const STOCK_LINE_PALETTE = ["#91A7FF", "#364FC7", "#F06595", "#A61E4D", "#868E96"];

const { artifactRenderers, artifactCategories } = defineArtifactCategories([
  {
    name: "Presentations",
    renderers: [presentationArtifactRenderer],
    icon: <Presentation size="1em" />,
  },
  {
    name: "Reports",
    renderers: [reportArtifactRenderer],
    icon: <FileText size="1em" />,
  },
]);

export function CloudAgentSurface() {
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  const [selectedModel, setSelectedModel] = usePersistedCloudModel();
  const [userId] = useState(getOrCreateCloudUserId);
  const [forkRegistry] = useState(() => new DemoForkRegistry(userId));
  const [llm] = useState(() =>
    createCloudChatLLM({
      initialModel: getPersistedCloudModel(),
      shouldSendFullHistory: (threadId) => forkRegistry.shouldSeed(threadId),
      onFullHistoryAccepted: (threadId) => forkRegistry.markSeeded(threadId),
    }),
  );
  const [path, setPath] = useState<string>();
  const cloudFetch = useMemo<typeof fetch>(() => {
    return async (input, init) => {
      if (typeof input !== "string" || input !== "/api/openui-cloud/frontend-token") {
        return fetch(input, init);
      }

      const headers = new Headers(init?.headers);
      headers.set(CLOUD_USER_ID_HEADER, userId);
      return fetch(input, { ...init, headers });
    };
  }, [userId]);
  const cloudStorage = useOpenuiCloudStorage({
    token: "/api/openui-cloud/frontend-token",
    apiBaseUrl: "https://api.thesys.dev",
    features: { artifact: true },
    fetch: cloudFetch,
  });
  const storage = useMemo(
    () => createDemoConversationStorage(cloudStorage, forkRegistry),
    [cloudStorage, forkRegistry],
  );

  useEffect(() => {
    llm.setSelectedModel(selectedModel);
  }, [llm, selectedModel]);

  const handleModelChange = useCallback(
    (model: string) => {
      llm.setSelectedModel(model);
      setSelectedModel(model);
    },
    [llm, setSelectedModel],
  );

  return (
    <div className="chat-agent-surface" data-chat-mode="cloud">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={chatLibrary}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
        logoUrl={OPENUI_CLOUD_LOGO_URL}
        theme={{ mode, lightTheme: { lineChartPalette: STOCK_LINE_PALETTE } }}
        starters={OPENUI_CLOUD_STARTERS}
        path={path}
        onNavigate={setPath}
      >
        <AgentInterface.Sidebar>
          <AgentInterface.SidebarHeader />
          <div className={styles.cloudSidebarPrimaryActions}>
            <AgentInterface.NewChatButton />
            <AgentInterface.ArtifactNav />
          </div>
          <AgentInterface.SidebarContent>
            <DemoConversationList />
            <AgentInterface.SidebarSeparator />
            <AgentInterface.ThreadList />
          </AgentInterface.SidebarContent>
          <SidebarUpgradeFooter />
        </AgentInterface.Sidebar>
        <AgentInterface.MobileHeader
          className={styles.cloudMobileHeader}
          agentName=""
          actions={
            <DemoAwareModelSwitcher
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
            />
          }
        />
        <AgentInterface.ThreadHeader className={styles.cloudThreadHeader}>
          <DemoAwareModelSwitcher selectedModel={selectedModel} onModelChange={handleModelChange} />
        </AgentInterface.ThreadHeader>
        <AgentInterface.Welcome
          title="Good to see you"
          description="What's on your mind today?"
          promptTemplates={OPENUI_CLOUD_PROMPT_TEMPLATES}
          glowAnimation
        />
        <AgentInterface.Composer>
          <DemoAwareComposer forkRegistry={forkRegistry} onNavigate={setPath} />
        </AgentInterface.Composer>
        <DemoPathSynchronizer path={path} onNavigate={setPath} />
      </AgentInterface>
    </div>
  );
}
