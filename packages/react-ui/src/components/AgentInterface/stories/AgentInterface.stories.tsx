import type { Message } from "@openuidev/react-headless";
import {
  ArrowLeft,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Settings,
  Share,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { makeMockLLM, makeMockStorage, mockSSEResponse } from "../../../__test-helpers/mockChat";
import { Button } from "../../Button";
import { IconButton } from "../../IconButton";
import { AgentInterface } from "../AgentInterface";
import { useNav } from "../_shared/navContext";
import logoUrl from "./thesysdev_logo.jpeg";

function getLastUserContent(messages: Message[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return "";
  return typeof lastUser.content === "string" ? lastUser.content : "";
}

const populatedStorage = makeMockStorage({
  listThreads: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      threads: [
        { id: "1", title: "First chat", createdAt: Date.now() },
        { id: "2", title: "Second chat", createdAt: Date.now() },
        { id: "3", title: "Third chat", createdAt: Date.now() },
      ],
    };
  },
  getMessages: async (threadId) => {
    if (!threadId) return [];
    return [
      { id: crypto.randomUUID(), role: "user", content: "Hello" },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Hi! How can I help today?",
      },
    ] as Message[];
  },
});

const emptyStorage = makeMockStorage({});

const defaultLLM = makeMockLLM({
  send: async () => {
    await new Promise((r) => setTimeout(r, 100));
    return mockSSEResponse("This is a response from the AI assistant.", 1000);
  },
});

const echoLLM = makeMockLLM({
  send: async ({ messages }) => {
    const content = getLastUserContent(messages);
    return mockSSEResponse(`You asked: "${content}"`, 1000);
  },
});

const SAMPLE_STARTERS = [
  {
    displayText: "Help me get started",
    prompt: "Help me get started",
    icon: <Sparkles size={16} />,
  },
  {
    displayText: "What can you do?",
    prompt: "What can you do?",
  },
  {
    displayText: "Tell me about your features",
    prompt: "Tell me about your features",
    icon: <MessageSquare size={16} />,
  },
];

const LONG_STARTERS = [
  {
    displayText: "Help me get started with this application and guide me through the features",
    prompt: "Help me get started",
    icon: <Sparkles size={16} />,
  },
  {
    displayText: "What can you do? I'd like to know all your capabilities",
    prompt: "What can you do?",
    icon: <Zap size={16} />,
  },
];

export default {
  title: "Components/AgentInterface",
  tags: ["dev"],
};

/** Bare default — everything renders from AgentInterface's internals. */
export const Default = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    />
  ),
};

/** Override only the composer at top level — sidebar + thread defaults persist. */
export const CustomComposer = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.Composer>
        <div style={{ padding: 16, background: "#f0f0f0", borderRadius: 8 }}>
          Custom composer placeholder — replaces the default input.
        </div>
      </AgentInterface.Composer>
    </AgentInterface>
  ),
};

/** Tweak just the sidebar header — Mode B props on SidebarHeader. */
export const CustomSidebarHeader = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.SidebarHeader
        logo={<div style={{ fontSize: 24 }}>🚀</div>}
        agentName={<strong style={{ color: "#7c3aed" }}>Custom Brand</strong>}
        collapseButton={false}
      />
    </AgentInterface>
  ),
};

/** Full sidebar override — user composes the inside. */
export const FullSidebarOverride = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.Sidebar>
        <AgentInterface.SidebarHeader logo={<div style={{ fontSize: 24 }}>🚀</div>} />
        <div style={{ padding: 12, fontSize: 12, color: "#666" }}>Custom nav section</div>
        <AgentInterface.SidebarSeparator />
        <AgentInterface.ThreadList />
      </AgentInterface.Sidebar>
    </AgentInterface>
  ),
};

/** Welcome screen with title, image, and inherited starters. */
export const WithWelcome = {
  render: () => (
    <AgentInterface
      storage={emptyStorage}
      llm={echoLLM}
      logoUrl={logoUrl}
      agentName="OpenUI Assistant"
      starters={SAMPLE_STARTERS}
      starterVariant="long"
    >
      <AgentInterface.Welcome
        title="Hi, I'm OpenUI Assistant"
        description="I help with questions about your account, products, and more."
        image={{ url: logoUrl }}
      />
    </AgentInterface>
  ),
};

/** Composer-only starters (no Welcome) — chips above the input. */
export const ComposerStarters = {
  render: () => (
    <AgentInterface
      storage={emptyStorage}
      llm={echoLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
      starters={SAMPLE_STARTERS}
    />
  ),
};

/** Custom thread header — Mode C children on ThreadHeader. */
export const WithThreadHeader = {
  render: () => (
    <AgentInterface storage={emptyStorage} llm={echoLLM} logoUrl={logoUrl} agentName="OpenUI">
      <AgentInterface.ThreadHeader>
        <Button iconLeft={<Share size={16} />} variant="secondary" size="small">
          Share
        </Button>
      </AgentInterface.ThreadHeader>
    </AgentInterface>
  ),
};

/** Custom mobile header — Mode B props with an extra actions button. */
export const CustomMobileHeader = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.MobileHeader
        actions={
          <IconButton
            icon={<Share size={16} />}
            aria-label="Share"
            size="medium"
            variant="secondary"
          />
        }
      />
    </AgentInterface>
  ),
};

/** Long-variant starters with welcome. */
export const LongStarters = {
  render: () => (
    <AgentInterface
      storage={emptyStorage}
      llm={echoLLM}
      logoUrl={logoUrl}
      agentName="OpenUI Assistant"
      starters={LONG_STARTERS}
      starterVariant="long"
    >
      <AgentInterface.Welcome
        title="Welcome"
        description="Pick a starter or type your own."
        image={{ url: logoUrl }}
      />
    </AgentInterface>
  ),
};

/** Welcome Mode C — fully custom hero content (title/image/starters props ignored). */
export const WelcomeCustomChildren = {
  render: () => (
    <AgentInterface
      storage={emptyStorage}
      llm={echoLLM}
      logoUrl={logoUrl}
      agentName="OpenUI Assistant"
    >
      <AgentInterface.Welcome>
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <div
            style={{
              width: 96,
              height: 96,
              margin: "0 auto 16px",
              borderRadius: 24,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={48} color="white" />
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 600 }}>Fully custom hero</h2>
          <p style={{ margin: 0, color: "rgba(0,0,0,0.5)", fontSize: 16 }}>
            When Welcome has children, all Mode B props (title/description/image/starters) are
            ignored.
          </p>
        </div>
      </AgentInterface.Welcome>
    </AgentInterface>
  ),
};

/** SidebarHeader Mode C — children fully replace the header (top row gone). */
export const SidebarHeaderCustomChildren = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.SidebarHeader>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            background: "#7c3aed",
            color: "white",
            borderRadius: 8,
            margin: 8,
          }}
        >
          <Sparkles size={20} />
          <strong>Branded header</strong>
        </div>
      </AgentInterface.SidebarHeader>
    </AgentInterface>
  ),
};

/** MobileHeader Mode C — replaces the whole bar. (Resize narrow to see.) */
export const MobileHeaderCustomChildren = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.MobileHeader>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 16px",
            background: "#111827",
            color: "white",
            width: "100%",
            fontWeight: 600,
          }}
        >
          Custom mobile bar
        </div>
      </AgentInterface.MobileHeader>
    </AgentInterface>
  ),
};

/** Explicit `components` — replace AssistantMessage + UserMessage rendering. */
export const CustomMessageComponents = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
      components={{
        AssistantMessage: ({ message, isStreaming }) => (
          <div
            style={{
              padding: 12,
              margin: "8px 16px",
              background: "#eef2ff",
              borderRadius: 12,
              borderLeft: "3px solid #4f46e5",
            }}
          >
            <strong style={{ color: "#4f46e5" }}>
              Assistant{isStreaming ? " (streaming)" : ""}
            </strong>
            <div style={{ marginTop: 4 }}>
              {typeof message.content === "string" ? message.content : "[non-text content]"}
            </div>
          </div>
        ),
        UserMessage: ({ message }) => (
          <div
            style={{
              padding: 12,
              margin: "8px 16px",
              background: "#fef3c7",
              borderRadius: 12,
              borderLeft: "3px solid #d97706",
              textAlign: "right",
            }}
          >
            <strong style={{ color: "#d97706" }}>You</strong>
            <div style={{ marginTop: 4 }}>
              {typeof message.content === "string" ? message.content : "[non-text content]"}
            </div>
          </div>
        ),
      }}
    />
  ),
};

/** Starters override: Welcome's own `starters` prop wins over the top-level. */
export const StartersOverrideAtWelcome = {
  render: () => (
    <AgentInterface
      storage={emptyStorage}
      llm={echoLLM}
      logoUrl={logoUrl}
      agentName="OpenUI Assistant"
      starters={[{ displayText: "Top-level starter (should NOT show)", prompt: "x" }]}
    >
      <AgentInterface.Welcome
        title="Welcome"
        description="Welcome's own starters override the top-level."
        image={{ url: logoUrl }}
        starters={SAMPLE_STARTERS}
        starterVariant="long"
      />
    </AgentInterface>
  ),
};

/**
 * Hierarchical-ownership warning: top-level SidebarHeader is IGNORED when
 * <AgentInterface.Sidebar> is also at top level. Open the console to see the
 * dev warning. The branded header inside Sidebar is what actually renders.
 */
export const HierarchicalOwnershipWarning = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      {/* This top-level SidebarHeader is ignored (dev warning logged) */}
      <AgentInterface.SidebarHeader logo={<div>🚫 Should not render</div>} agentName="Ignored" />
      <AgentInterface.Sidebar>
        <AgentInterface.SidebarHeader logo={<div style={{ fontSize: 22 }}>✅</div>} />
        <AgentInterface.SidebarSeparator />
        <AgentInterface.ThreadList />
      </AgentInterface.Sidebar>
    </AgentInterface>
  ),
};

/**
 * SidebarItem alongside ThreadList. Custom nav items inherit the same visual
 * language (hover, selected, padding) as ThreadList entries, so they blend
 * naturally above or below the thread history.
 */
const SidebarItemsStory = () => {
  const [section, setSection] = useState<"home" | "favorites" | "docs">("home");

  return (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.Sidebar>
        <AgentInterface.SidebarHeader />

        {/* Top section: custom SidebarItems with icons + selected state */}
        <div style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          <AgentInterface.SidebarItem
            icon={<Sparkles size={14} />}
            selected={section === "home"}
            onClick={() => setSection("home")}
          >
            Home
          </AgentInterface.SidebarItem>
          <AgentInterface.SidebarItem
            icon={<Star size={14} />}
            selected={section === "favorites"}
            onClick={() => setSection("favorites")}
            trailing={<span style={{ fontSize: 11 }}>3</span>}
          >
            Favorites
          </AgentInterface.SidebarItem>
          <AgentInterface.SidebarItem
            icon={<BookOpen size={14} />}
            selected={section === "docs"}
            onClick={() => setSection("docs")}
          >
            Docs
          </AgentInterface.SidebarItem>
        </div>

        <AgentInterface.SidebarSeparator />

        {/* Default ThreadList below */}
        <AgentInterface.SidebarContent>
          <AgentInterface.ThreadList />
        </AgentInterface.SidebarContent>

        {/* Footer items */}
        <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: 2 }}>
          <AgentInterface.SidebarItem icon={<Settings size={14} />}>
            Settings
          </AgentInterface.SidebarItem>
          <AgentInterface.SidebarItem icon={<HelpCircle size={14} />}>
            Help & feedback
          </AgentInterface.SidebarItem>
        </div>
      </AgentInterface.Sidebar>
    </AgentInterface>
  );
};

export const SidebarItems = {
  render: () => <SidebarItemsStory />,
};

/**
 * Routing with `<AgentInterface.Route>` and `SidebarItem.path`. The thread
 * region is fully replaced by the matched Route's content. Demonstrates two
 * ways to return to the thread:
 *   1. Explicit "Back to chat" button calling `navigate(undefined)` from
 *      inside the route page (see SettingsPage / DocsPage).
 *   2. Implicit — clicking any thread in the sidebar's ThreadList
 *      auto-clears the path (ThreadButton calls navigate(undefined) internally).
 */
const BackToChatButton = () => {
  const { navigate } = useNav();
  return (
    <Button
      variant="secondary"
      size="small"
      iconLeft={<ArrowLeft size={14} />}
      onClick={() => navigate(undefined)}
    >
      Back to chat
    </Button>
  );
};

const RoutePage = ({ title, body }: { title: string; body: string }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 24,
      height: "100%",
      overflowY: "auto",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{title}</h1>
      <BackToChatButton />
    </div>
    <p style={{ margin: 0, color: "rgba(0,0,0,0.6)" }}>{body}</p>
  </div>
);

const RoutingStory = () => (
  <AgentInterface storage={populatedStorage} llm={defaultLLM} logoUrl={logoUrl} agentName="OpenUI">
    <AgentInterface.Sidebar>
      <AgentInterface.SidebarHeader />

      <div style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        <AgentInterface.SidebarItem path="/settings" icon={<Settings size={14} />}>
          Settings
        </AgentInterface.SidebarItem>
        <AgentInterface.SidebarItem path="/docs" icon={<BookOpen size={14} />}>
          Docs
        </AgentInterface.SidebarItem>
        <AgentInterface.SidebarItem path="/help" icon={<HelpCircle size={14} />}>
          Help
        </AgentInterface.SidebarItem>
      </div>

      <AgentInterface.SidebarSeparator />

      <AgentInterface.SidebarContent>
        <AgentInterface.ThreadList />
      </AgentInterface.SidebarContent>
    </AgentInterface.Sidebar>

    <AgentInterface.Route path="/settings">
      <RoutePage
        title="Settings"
        body="This entire thread region is replaced when the active path matches the Route. Click 'Back to chat' to call navigate(undefined), or click any thread in the sidebar to auto-clear the path."
      />
    </AgentInterface.Route>

    <AgentInterface.Route path="/docs">
      <RoutePage
        title="Docs"
        body="Routes are siblings under <AgentInterface>. Exact-string match (no wildcards). When no Route matches, the thread view re-emerges with its defaults."
      />
    </AgentInterface.Route>

    <AgentInterface.Route path="/help">
      <RoutePage
        title="Help"
        body="Multiple Routes are supported. Each is a top-level <AgentInterface.Route> with a unique path."
      />
    </AgentInterface.Route>
  </AgentInterface>
);

export const Routing = {
  render: () => <RoutingStory />,
};

/**
 * Same routing setup but in *controlled* mode — `path` + `onNavigate` come
 * from parent state. Useful when syncing with Next.js / React Router / your
 * own custom router. Defaults to `/settings` so the route content shows
 * immediately on mount.
 */
const ControlledRoutingStory = () => {
  const [path, setPath] = useState<string | undefined>("/settings");

  return (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
      path={path}
      onNavigate={setPath}
    >
      <AgentInterface.Sidebar>
        <AgentInterface.SidebarHeader />

        <div style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          <AgentInterface.SidebarItem path="/settings" icon={<Settings size={14} />}>
            Settings
          </AgentInterface.SidebarItem>
          <AgentInterface.SidebarItem path="/docs" icon={<BookOpen size={14} />}>
            Docs
          </AgentInterface.SidebarItem>
        </div>

        <AgentInterface.SidebarSeparator />

        <AgentInterface.SidebarContent>
          <AgentInterface.ThreadList />
        </AgentInterface.SidebarContent>

        <div style={{ padding: 8, fontSize: 11, color: "#666" }}>
          current path: {path === undefined ? "(thread)" : path}
        </div>
      </AgentInterface.Sidebar>

      <AgentInterface.Route path="/settings">
        <RoutePage title="Settings (controlled)" body="Parent owns `path` state." />
      </AgentInterface.Route>

      <AgentInterface.Route path="/docs">
        <RoutePage title="Docs (controlled)" body="Sync with your router here." />
      </AgentInterface.Route>
    </AgentInterface>
  );
};

export const ControlledRouting = {
  render: () => <ControlledRoutingStory />,
};
