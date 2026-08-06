import { analytics } from "./analytics";

export const CHAT_DEMO_EVENTS = {
  experienceView: "chat_demo:experience_view",
  threadView: "chat_demo:thread_view",
  artifactView: "chat_demo:artifact_view",
  previewChange: "chat_demo:preview_change",
  upgradePromptView: "chat_demo:upgrade_prompt_view",
  upgradePromptClick: "chat_demo:upgrade_prompt_click",
  upgradeCtaClick: "chat_demo:upgrade_cta_click",
  buildMenuOpen: "chat_demo:build_menu_open",
  continuationCreate: "chat_demo:continuation_create",
  promptSubmit: "chat_demo:prompt_submit",
  generationEnd: "chat_demo:generation_end",
} as const;

export type ChatDemoId = "stock_comparison" | "japan_travel_guide" | "blockbuster_report";
export type ChatDemoPreview = "mobile" | "tablet" | "desktop";
export type ChatDemoHostBreakpoint = "mobile_host" | "tablet_host" | "desktop_host";
export type ChatDemoConversationOrigin = "new_chat" | "demo_continuation";
export type ChatDemoArtifactType = "report" | "slides";

type ChatDemoEventName = (typeof CHAT_DEMO_EVENTS)[keyof typeof CHAT_DEMO_EVENTS];

interface ChatDemoEventProperties {
  [CHAT_DEMO_EVENTS.experienceView]: {
    host_breakpoint: ChatDemoHostBreakpoint;
    available_preview_count: 1 | 2 | 3;
    initial_preview: ChatDemoPreview;
  };
  [CHAT_DEMO_EVENTS.threadView]: {
    demo_id: ChatDemoId;
  };
  [CHAT_DEMO_EVENTS.artifactView]: {
    artifact_id: ChatDemoArtifactId;
    artifact_type: ChatDemoArtifactType;
    demo_id?: ChatDemoId;
  };
  [CHAT_DEMO_EVENTS.previewChange]: {
    from_preview: ChatDemoPreview;
    to_preview: ChatDemoPreview;
    host_breakpoint: ChatDemoHostBreakpoint;
  };
  [CHAT_DEMO_EVENTS.upgradePromptView]: Record<string, never>;
  [CHAT_DEMO_EVENTS.upgradePromptClick]: {
    demo_id?: ChatDemoId;
  };
  [CHAT_DEMO_EVENTS.upgradeCtaClick]: {
    placement: "desktop" | "mobile";
    destination: "getting_started_docs";
    demo_id?: ChatDemoId;
  };
  [CHAT_DEMO_EVENTS.buildMenuOpen]: Record<string, never>;
  [CHAT_DEMO_EVENTS.continuationCreate]: {
    demo_id: ChatDemoId;
  };
  [CHAT_DEMO_EVENTS.promptSubmit]: ChatDemoGenerationContext;
  [CHAT_DEMO_EVENTS.generationEnd]: ChatDemoGenerationContext & {
    generation_outcome: "success" | "failure" | "cancelled";
  };
}

export interface ChatDemoGenerationContext {
  conversation_origin: ChatDemoConversationOrigin;
  model: string;
  demo_id?: ChatDemoId;
}

export type ChatDemoArtifactId =
  | "big_tech_2025"
  | "japan_highlights"
  | "blockbuster_box_office"
  | "q2_business_health"
  | "project_platform_brief"
  | "global_coffee_trends"
  | "world_cup_2026_guide"
  | "ai_product_launch";

export interface ChatDemoArtifactAnalytics {
  artifactId: ChatDemoArtifactId;
  artifactType: ChatDemoArtifactType;
  demoId?: ChatDemoId;
}

const DEMO_IDS: Readonly<Record<string, ChatDemoId>> = {
  demo_stock_comparison: "stock_comparison",
  demo_travel_planner: "japan_travel_guide",
  demo_blockbusters: "blockbuster_report",
};

const ARTIFACTS: Readonly<Record<string, ChatDemoArtifactAnalytics>> = {
  demo_artifact_big_tech_2025: {
    artifactId: "big_tech_2025",
    artifactType: "report",
    demoId: "stock_comparison",
  },
  demo_artifact_japan_highlights: {
    artifactId: "japan_highlights",
    artifactType: "slides",
    demoId: "japan_travel_guide",
  },
  demo_artifact_blockbuster_box_office: {
    artifactId: "blockbuster_box_office",
    artifactType: "slides",
    demoId: "blockbuster_report",
  },
  demo_artifact_q2_business_health: {
    artifactId: "q2_business_health",
    artifactType: "report",
  },
  demo_artifact_project_platform_brief: {
    artifactId: "project_platform_brief",
    artifactType: "report",
  },
  demo_artifact_global_coffee_trends: {
    artifactId: "global_coffee_trends",
    artifactType: "report",
  },
  demo_artifact_world_cup_2026_guide: {
    artifactId: "world_cup_2026_guide",
    artifactType: "slides",
  },
  demo_artifact_ai_product_launch: {
    artifactId: "ai_product_launch",
    artifactType: "slides",
  },
};

export function getChatDemoId(sourceId: string | undefined): ChatDemoId | undefined {
  return sourceId ? DEMO_IDS[sourceId] : undefined;
}

export function getChatDemoArtifactAnalytics(
  sourceId: string | undefined,
): ChatDemoArtifactAnalytics | undefined {
  return sourceId ? ARTIFACTS[sourceId] : undefined;
}

export function captureChatDemoEvent<EventName extends ChatDemoEventName>(
  eventName: EventName,
  properties: ChatDemoEventProperties[EventName],
): void {
  if (typeof window === "undefined" || isLocalAnalyticsHost(window.location.hostname)) return;

  analytics.capture(eventName, {
    instrumentation_version: 1,
    analytics_environment: getAnalyticsEnvironment(window.location.hostname),
    ...properties,
  });
}

function isLocalAnalyticsHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function getAnalyticsEnvironment(hostname: string): "production" | "preview" {
  return hostname.endsWith(".vercel.app") ? "preview" : "production";
}
