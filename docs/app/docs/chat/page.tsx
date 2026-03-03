import { Button } from "@/components/button";
import { HeroBadge } from "@/components/hero-badge";
import { Card, Cards } from "fumadocs-ui/components/card";
import {
  Code2,
  Database,
  Layout,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Palette,
  PanelRightOpen,
  Zap,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "OpenUI Chat SDK",
  description:
    "Production-ready chat UI for AI agents. Drop-in layouts, streaming, and state management.",
};

export default function ChatOverviewPage() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-6 space-y-20">
      {/* --- Hero Section --- */}
      <section className="space-y-6 text-center md:text-left">
        <HeroBadge icon="MessageSquare" text="Generative UI Chat" />
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          OpenUI{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Chat SDK
          </span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          A complete framework for building AI interfaces. Use our{" "}
          <strong>pre-built layouts</strong> for speed, or our <strong>headless hooks</strong> for
          total control.
        </p>

        <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
          <Button href="/docs/chat/installation" text="Installation" variant="primary" />
          <Button href="/docs/chat/copilot" text="Explore Layouts" variant="secondary" />
        </div>
      </section>

      {/* --- Layouts Showcase --- */}
      <section>
        <div className="flex items-center gap-2 mb-8">
          <Layout className="text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Batteries-Included Layouts
          </h2>
        </div>

        <Cards className="lg:grid-cols-3">
          <Card
            icon={<PanelRightOpen className="text-slate-600 dark:text-slate-400" size={20} />}
            title="Copilot"
            description="A sidebar assistant that lives alongside your main application content."
            href="/docs/chat/copilot"
          />
          <Card
            icon={<Maximize2 className="text-slate-600 dark:text-slate-400" size={20} />}
            title="Full Screen"
            description="A standalone, immersive chat page similar to ChatGPT or Claude."
            href="/docs/chat/fullscreen"
          />
          <Card
            icon={<MessageCircle className="text-slate-600 dark:text-slate-400" size={20} />}
            title="Bottom Tray"
            description="A floating support-style widget that expands from the bottom corner."
            href="/docs/chat/bottom-tray"
          />
        </Cards>
      </section>

      {/* --- Headless / Features Split --- */}
      <section className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Left: Core Features */}
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Core Capabilities</h2>
          </div>

          <Cards>
            <Card
              icon={<MessageSquare className="text-slate-400" size={20} />}
              title="Streaming Native"
              description="Handles text deltas, optimistic updates, and loading states automatically."
            />
            <Card
              icon={<Database className="text-slate-400" size={20} />}
              title="Thread Persistence"
              description="Built-in support for saving and loading conversation history via simple API contracts."
            />
            <Card
              icon={<Palette className="text-slate-400" size={20} />}
              title="Theming"
              description="Customize every color, radius, and font using CSS variables or Tailwind."
            />
          </Cards>
        </div>

        {/* Right: Headless Code Snippet */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Code2 className="text-purple-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Go Headless</h2>
          </div>

          <p className="text-slate-600 dark:text-slate-400">
            Need full control? Use the `useChat` hook to build your own UI while we handle the
            state.
          </p>

          <div className="relative rounded-xl overflow-hidden bg-slate-900 shadow-xl border border-slate-800">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/50">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-sm font-mono text-slate-300">
                {`import { useChat } from '@openuidev/react';

function CustomChat() {
  const { messages, append, isLoading } = useChat();

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          {m.content}
        </div>
      ))}

      <input
        onChange={e => append(e.target.value)}
      />
    </div>
  );
}`}
              </pre>
            </div>
          </div>

          <div className="text-right">
            <Link
              href="/docs/chat/headless-intro"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Read the Headless Guide →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
