"use client";

import {
  agUIAdapter,
  ChatProvider,
  fetchLLM,
  openAIMessageFormat,
  useOpenuiCloudStorage,
  useThread,
  useThreadList,
  type Thread,
} from "@openuidev/react-headless";
import { ThemeProvider } from "@openuidev/react-ui";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChatShell } from "../../components/chat-shell";
import { AskProvider, DriversPage, HomeDashboard, StandingsPage, TeamsPage } from "../../components/dashboards";
import { Sidebar, type SidebarThread } from "../../components/sidebar";
import { f1Theme } from "../../f1-typography";
import { messageText } from "./messages";
import { RadioThread } from "./radio-thread";
import { RadioWelcome } from "./radio-welcome";

/*
 * The Radio chat. /new opens a new conversation, /[threadId] an earlier one,
 * and / and the other sidebar destinations show a dashboard. It lives in the
 * layout, with one empty catch-all page beneath it, so the provider, sidebar and
 * input stay mounted while the URL moves to the new thread's address mid-answer.
 */

// The route loads the thread's earlier turns from its Gateway conversation and uses only
// the new question; agUIAdapter reads the AG-UI events it streams back.
const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: agUIAdapter(),
  messageFormat: openAIMessageFormat,
});

// The route takes questions of up to 600 characters.
const MAX_QUESTION = 600;

// The sidebar destinations: Home is /, the others sit beside it.
const DESTINATIONS: Record<string, { path: string; page: ReactNode }> = {
  home: { path: "/", page: <HomeDashboard /> },
  standings: { path: "/standings", page: <StandingsPage /> },
  drivers: { path: "/drivers", page: <DriversPage /> },
  teams: { path: "/teams", page: <TeamsPage /> },
};

// Sidebar second line: when the conversation started.
function when(createdAt: Thread["createdAt"]) {
  const date = new Date(createdAt);
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString(undefined, { weekday: "short" });
  if (days < 14) return "Last week";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function RadioChat() {
  const router = useRouter();
  const segment = useParams<{ slug?: string[] }>().slug?.[0] ?? null;
  // /new is a new chat: the empty state, with no destination highlighted (it isn't Home).
  const pathname = usePathname();
  const isNewChat = segment === "new";
  const nav = Object.keys(DESTINATIONS).find((id) => DESTINATIONS[id].path === pathname) ?? null;
  // Any other single segment is a thread id.
  const routeThread = segment && !isNewChat && !nav ? segment : null;
  const [collapsed, setCollapsed] = useState(true);

  const threads = useThreadList((s) => s.threads);
  const selectedThreadId = useThreadList((s) => s.selectedThreadId);
  const loadThreads = useThreadList((s) => s.loadThreads);
  const selectThread = useThreadList((s) => s.selectThread);
  const switchToNewThread = useThreadList((s) => s.switchToNewThread);
  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const processMessage = useThread((s) => s.processMessage);
  const threadError = useThread((s) => s.threadError);

  useEffect(loadThreads, [loadThreads]);

  // The URL picks the conversation.
  useEffect(() => {
    if (!routeThread) return switchToNewThread();
    selectThread(routeThread);
  }, [routeThread, selectThread, switchToNewThread]);

  // A thread Gateway can't load (deleted, or another user's) falls back to Home.
  useEffect(() => {
    if (routeThread && threadError) router.replace("/");
  }, [routeThread, threadError, router]);

  // The first question creates the thread; move the URL onto it without remounting anything.
  useEffect(() => {
    if (selectedThreadId && selectedThreadId !== routeThread) router.replace(`/${selectedThreadId}`);
    // Only when the store picks a new thread, not when the URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId]);

  const sidebarThreads = useMemo<SidebarThread[]>(
    () => threads.map((t) => ({ id: t.id, title: messageText(t.title), meta: when(t.createdAt) })),
    [threads],
  );

  return (
    // The carbon sidebar floats on the left; the chat page fills the rest.
    <div style={{ position: "relative", height: "100dvh", paddingLeft: collapsed ? 52 : 280, background: "#FFFFFF", transition: "padding-left 180ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
      <Sidebar
        floating
        threads={sidebarThreads}
        activeThread={routeThread}
        activeNav={isNewChat ? null : (nav ?? undefined)}
        liveThread={isRunning ? selectedThreadId : null}
        onCollapsedChange={setCollapsed}
        onNavigate={(id) => DESTINATIONS[id] && router.push(DESTINATIONS[id].path)}
        onOpenThread={(id) => router.push(`/${id}`)}
        onNewChat={() => (router.push("/new"), document.querySelector<HTMLInputElement>(".radio-input input")?.focus())}
      />
      <ChatShell
        threadKey={routeThread ?? pathname}
        // A new chat opens on the welcome and starting grid; each destination on its dashboard.
        empty={isNewChat ? <RadioWelcome onPick={(prompt) => processMessage({ role: "user", content: prompt })} /> : null}
        // Anything picked on a dashboard starts a new chat with its question, like the first send from /new.
        page={nav && <AskProvider value={(q) => processMessage({ role: "user", content: q.slice(0, MAX_QUESTION) })}>{DESTINATIONS[nav].page}</AskProvider>}
        input={{
          busy: isRunning,
          maxLength: MAX_QUESTION,
          // The team-radio clip on send; typing stays silent.
          sound: "send",
          onSend: (text) => processMessage({ role: "user", content: text }),
        }}
      >
        {messages.length > 0 && <RadioThread />}
      </ChatShell>
    </div>
  );
}

export default function DesignLayout({ children }: { children: ReactNode }) {
  // Threads are Gateway conversations, which the browser reaches with a short-lived token from
  // /api/frontend-token. The chat route appends each turn, so a reopened thread loads it.
  const storage = useOpenuiCloudStorage({ token: "/api/frontend-token", features: { artifact: false } });
  return (
    <ThemeProvider mode="light" lightTheme={f1Theme}>
      <ChatProvider llm={llm} storage={storage}>
        <RadioChat />
        {children}
      </ChatProvider>
    </ThemeProvider>
  );
}
