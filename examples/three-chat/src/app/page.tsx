"use client";

import { Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Renderer, type OpenUIError } from "@openuidev/react-lang";
import { Bot, Box, ChevronDown, ChevronRight, CircleStop, Compass, RotateCcw, SendHorizonal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { openui3dLibrary } from "@/openui3d/library";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const starters = [
  "Build a compact dashboard comparing revenue, churn, and activation.",
  "Create a contact form with name, email, company, and message.",
  "Show the PMNDRS instanced vertex colors cube field with cool motion.",
  "Drop physics letters spelling HELLO WORLD into a tray so they pile up.",
];

function isScene3D(content: string) {
  return /\broot\s*=\s*Scene3D\s*\(/.test(content);
}

function combined3D(messages: ChatMessage[]) {
  const code = messages
    .filter((message) => message.role === "assistant" && isScene3D(message.content))
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join("\n");
  return makeSceneUpdatesDurable(code);
}

function strip3DCode(content: string) {
  if (!isScene3D(content)) return content;
  return "";
}

function wants3DScene(content: string) {
  return /\b(3d|three|webgl|shader|mesh|scene|canvas|cube|sphere|physics|rigid|bounce|collide|walk|door|geojson|geospatial|map|terrain|glb|gltf|point\s*cloud|letter|text3d|floor|rapier|drop|fall|pile)\b/i.test(
    content,
  );
}

function looksLikeOpenUIStream(content: string) {
  return (
    isScene3D(content) ||
    /^\s*[a-zA-Z]\w*\s*=/m.test(content) ||
    /\b(Scene3D|PerspectiveCamera|OrbitControls|WalkControls|Mesh|RigidMesh|RigidText|Text3D|InstancedCubes|BrunoChallenge|ShaderPreset|GeoJson|LineLayer|TerrainLayer)\s*\(/.test(
      content,
    )
  );
}

function previousUserMessage(messages: ChatMessage[], index: number) {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") return messages[i].content;
  }
  return "";
}

function splitTopLevel(value: string) {
  const parts: string[] = [];
  let current = "";
  let parens = 0;
  let brackets = 0;
  let braces = 0;
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (const char of value) {
    current += char;

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") quote = char;
    else if (char === "(") parens += 1;
    else if (char === ")") parens -= 1;
    else if (char === "[") brackets += 1;
    else if (char === "]") brackets -= 1;
    else if (char === "{") braces += 1;
    else if (char === "}") braces -= 1;

    if (char === "," && parens === 0 && brackets === 0 && braces === 0) {
      parts.push(current.slice(0, -1).trim());
      current = "";
    }
  }

  const tail = current.trim();
  if (tail) parts.push(tail);
  return parts;
}

function callArgsRange(line: string, callName: string) {
  const callStart = line.indexOf(`${callName}(`);
  if (callStart === -1) return null;

  const start = callStart + callName.length + 1;
  let depth = 1;
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (let index = start; index < line.length; index += 1) {
    const char = line[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") quote = char;
    else if (char === "(") depth += 1;
    else if (char === ")") {
      depth -= 1;
      if (depth === 0) return { start, end: index };
    }
  }

  return null;
}

function arrayItems(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  const body = trimmed.slice(1, -1).trim();
  if (!body) return [];
  return splitTopLevel(body).filter(Boolean);
}

function addUnique(items: string[], item: string) {
  if (!items.includes(item)) items.push(item);
}

function makeSceneUpdatesDurable(code: string) {
  const durableObjects: string[] = [];

  return code
    .split("\n")
    .map((line) => {
      if (!/^\s*root\s*=/.test(line) || !line.includes("Scene3D(")) return line;

      const range = callArgsRange(line, "Scene3D");
      if (!range) return line;

      const args = splitTopLevel(line.slice(range.start, range.end));
      if (args.length < 3) return line;

      const objects = arrayItems(args[2]);
      if (!objects) return line;

      objects.forEach((object) => addUnique(durableObjects, object));
      args[2] = `[${durableObjects.join(", ")}]`;

      return `${line.slice(0, range.start)}${args.join(", ")}${line.slice(range.end)}`;
    })
    .join("\n");
}

function SceneStreamPreview({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  const visibleLines = expanded ? lines.slice(-14) : lines.slice(-3);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 text-zinc-100 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between border-b border-white/10 px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          OpenUI Lang stream
        </div>
        <div className="text-[11px] text-zinc-500">
          {lines.length} {lines.length === 1 ? "statement" : "statements"}
        </div>
      </button>
      {expanded ? (
        lines.length > 0 ? (
          <pre className="max-h-72 overflow-hidden px-3 py-2 font-mono text-[11px] leading-5 text-zinc-300">
            {visibleLines.map((line, lineIndex) => {
              const isLastLine = lineIndex === visibleLines.length - 1;
              return (
                <div key={`${lineIndex}-${line}`} className={isLastLine && isStreaming ? "text-emerald-200" : ""}>
                  <span className="select-none pr-2 text-zinc-600">
                    {String(lines.length - visibleLines.length + lineIndex + 1).padStart(2, "0")}
                  </span>
                  {line}
                  {isLastLine && isStreaming ? (
                    <span className="ml-1 inline-block h-3 w-1 translate-y-0.5 animate-pulse bg-emerald-300" />
                  ) : null}
                </div>
              );
            })}
          </pre>
        ) : (
          <div className="px-3 py-2 font-mono text-[11px] leading-5 text-zinc-500">
            Waiting for OpenUI Lang
            {isStreaming ? <span className="ml-1 inline-block h-3 w-1 translate-y-0.5 animate-pulse bg-emerald-300" /> : null}
          </div>
        )
      ) : null}
    </div>
  );
}

function supportsHtmlInCanvas() {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas") as HTMLCanvasElement & {
    layoutSubtree?: boolean;
    requestPaint?: () => void;
  };
  const ctx = canvas.getContext("2d") as
    | (CanvasRenderingContext2D & {
        drawElementImage?: (...args: unknown[]) => unknown;
      })
    | null;
  return "layoutSubtree" in canvas && typeof ctx?.drawElementImage === "function";
}

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderErrors, setRenderErrors] = useState<OpenUIError[]>([]);
  const [htmlInCanvas, setHtmlInCanvas] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sceneCode = useMemo(() => combined3D(messages), [messages]);
  const has3D = Boolean(sceneCode);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHtmlInCanvas(supportsHtmlInCanvas());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isStreaming]);

  async function sendPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    setMessages((current) => [...current, userMessage, { role: "assistant", content: "" }]);
    setInput("");
    setError(null);
    setRenderErrors([]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? `Chat request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((current) => {
          const copy = [...current];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: last.content + chunk };
          }
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setError(null);
    setRenderErrors([]);
    setIsStreaming(false);
  }

  return (
    <main className="relative h-screen overflow-hidden bg-white text-zinc-950">
      <Canvas
        className="absolute inset-0"
        orthographic
        camera={{ position: [0, 0, 10], zoom: 100 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#ffffff"]} />
        <Html fullscreen transform={false}>
          <div
            className={`grid h-screen transition-[grid-template-columns] duration-500 ease-out ${
              has3D ? "grid-cols-[minmax(420px,0.92fr)_minmax(460px,1.08fr)]" : "grid-cols-[1fr_0fr]"
            }`}
          >
            <section className="flex min-w-0 flex-col bg-white">
              <header className="shrink-0 border-b border-zinc-200 bg-white/95 px-5 py-3 backdrop-blur">
                <div className="mx-auto flex max-w-3xl items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Box size={18} />
                    OpenUI Chat
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-zinc-500">
                      {htmlInCanvas ? "HTML-in-Canvas available" : "HTML-in-Canvas fallback"}
                    </div>
                    <button
                      type="button"
                      onClick={newChat}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      <RotateCcw size={13} />
                      New chat
                    </button>
                  </div>
                </div>
              </header>

              <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-4 py-10">
                    <div className="mb-6">
                      <h1 className="text-2xl font-semibold tracking-normal">What should we build?</h1>
                      <p className="mt-2 text-sm text-zinc-600">
                        Normal OpenUI chat by default. Ask for 3D, shaders, physics, or GeoJSON when you want the canvas to open.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {starters.map((starter) => (
                        <button
                          key={starter}
                          type="button"
                          onClick={() => sendPrompt(starter)}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-left text-sm leading-5 text-zinc-800 transition hover:border-zinc-300 hover:bg-white"
                        >
                          {starter}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
                    {messages.map((message, index) => {
                      const visibleContent = strip3DCode(message.content);
                      const messageIs3D = message.role === "assistant" && isScene3D(message.content);
                      const isLatestStreamingAssistant = isStreaming && index === messages.length - 1;
                      const shouldShowScenePreview =
                        message.role === "assistant" &&
                        (messageIs3D ||
                          looksLikeOpenUIStream(message.content) ||
                          (isLatestStreamingAssistant && wants3DScene(previousUserMessage(messages, index))));

                      return (
                        <div key={index} className="flex gap-3">
                          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
                            {message.role === "assistant" ? <Bot size={14} /> : <Compass size={14} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            {message.role === "assistant" ? (
                              shouldShowScenePreview ? (
                                <SceneStreamPreview
                                  content={message.content}
                                  isStreaming={isLatestStreamingAssistant}
                                />
                              ) : visibleContent ? (
                                <div className="whitespace-pre-wrap text-sm leading-6 text-zinc-800">
                                  {visibleContent}
                                  {isStreaming && index === messages.length - 1 ? (
                                    <span className="ml-1 inline-block h-4 w-1 translate-y-0.5 animate-pulse bg-zinc-500" />
                                  ) : null}
                                </div>
                              ) : (
                                <div className="text-sm text-zinc-500">Thinking...</div>
                              )
                            ) : (
                              <div className="rounded-lg bg-zinc-100 px-3 py-2 text-sm leading-6 text-zinc-900">
                                {message.content}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <form
                className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendPrompt(input);
                }}
              >
                <div className="mx-auto flex max-w-3xl items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendPrompt(input);
                      }
                    }}
                    rows={1}
                    placeholder="Message OpenUI..."
                    className="max-h-36 min-h-11 flex-1 resize-none rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  />
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-200 text-zinc-700"
                    >
                      <CircleStop size={17} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <SendHorizonal size={17} />
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section
              className={`min-w-0 overflow-hidden border-l border-zinc-200 bg-white transition-[opacity,transform] duration-500 ease-out ${
                has3D ? "opacity-100 translate-x-0" : "pointer-events-none translate-x-8 opacity-0"
              }`}
            >
              {sceneCode && (
                <Renderer
                  response={sceneCode}
                  library={openui3dLibrary}
                  isStreaming={isStreaming}
                  onError={setRenderErrors}
                />
              )}
              {renderErrors.length > 0 && (
                <div className="absolute bottom-4 right-4 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
                  {renderErrors[0]?.message}
                </div>
              )}
            </section>
          </div>
        </Html>
      </Canvas>
    </main>
  );
}
