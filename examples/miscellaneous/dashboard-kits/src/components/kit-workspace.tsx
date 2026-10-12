"use client";

import { Renderer, type OpenUIError } from "@openuidev/react-lang";
import { ThemeProvider } from "@openuidev/react-ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { KITS } from "../kits";
import { createToolProvider, KIT_LIBRARIES, type ToolCall } from "../kits/client";

type View = "gallery" | "generate" | "prompt";
type ThemeChoice = "system" | "light" | "dark";

/** The viewer's theme choice, remembered in this browser, resolved against the OS setting. */
function useThemeMode() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kit-theme") as ThemeChoice | null;
      if (saved === "light" || saved === "dark" || saved === "system") setChoice(saved);
    } catch {
      // Storage can be unavailable; the system setting still applies.
    }
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(query.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  const choose = (next: ThemeChoice) => {
    setChoice(next);
    try {
      localStorage.setItem("kit-theme", next);
    } catch {
      // Not remembered, but still applied for this visit.
    }
  };
  const mode: "light" | "dark" = choice === "system" ? (systemDark ? "dark" : "light") : choice;
  return { choice, choose, mode };
}

const KIT_ICONS: Record<string, string> = {
  ecommerce:
    "M4 6h16l-1.5 9.5a2 2 0 0 1-2 1.5H7.5a2 2 0 0 1-2-1.5L4 6Zm0 0L3.2 3H1.5M9 21h.01M16 21h.01",
  analytics: "M4 20V10m6 10V4m6 16v-7m6 7V8",
};

export function KitWorkspace() {
  const [kitId, setKitId] = useState(KITS[0].id);
  const [view, setView] = useState<View>("gallery");
  const { choice, choose, mode } = useThemeMode();
  const kit = KITS.find((k) => k.id === kitId)!;

  return (
    <ThemeProvider mode={mode}>
      <main className="workspace kit-theme" data-mode={mode}>
        <header className="workspace__bar">
          <div className="workspace__brand">
            <span className="workspace__logo" aria-hidden>
              <svg viewBox="0 0 20 20">
                <rect x="2" y="2" width="7" height="9" rx="2" />
                <rect x="11" y="2" width="7" height="5" rx="2" />
                <rect x="2" y="13" width="7" height="5" rx="2" />
                <rect x="11" y="9" width="7" height="9" rx="2" />
              </svg>
            </span>
            <span>
              <strong>Dashboard kits</strong>
              <span className="workspace__crumb">OpenUI example</span>
            </span>
          </div>
          <div className="segmented" role="radiogroup" aria-label="Theme">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={choice === t}
                onClick={() => choose(t)}
              >
                {{ light: "Light", dark: "Dark", system: "System" }[t]}
              </button>
            ))}
          </div>
        </header>

        <section className="workspace__intro">
          <h1>Dashboards a model can build, in two domains</h1>
          <p>
            Each kit adds a domain&apos;s components, data tools, rules, and worked examples to the
            dashboard artifact&apos;s base components. Pick a kit, then browse its dashboards,
            generate one from a sentence, or read the prompt it sends.
          </p>
        </section>

        <nav className="kit-picker" aria-label="Kits">
          {KITS.map((k) => (
            <button
              key={k.id}
              type="button"
              className="kit-picker__option"
              aria-pressed={k.id === kitId}
              onClick={() => setKitId(k.id)}
            >
              <span className="kit-picker__icon" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d={KIT_ICONS[k.id] ?? KIT_ICONS.analytics} />
                </svg>
              </span>
              <span className="kit-picker__text">
                <span className="kit-picker__name">{k.name}</span>
                <span className="kit-picker__tagline">{k.tagline}</span>
              </span>
              <span className="kit-picker__meta">
                {k.tools.length} tools · {k.gallery.length} dashboards
              </span>
            </button>
          ))}
        </nav>

        <div className="tabs" role="tablist" aria-label="Views">
          {(["gallery", "generate", "prompt"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={v === view}
              className="tabs__tab"
              onClick={() => setView(v)}
            >
              {{ gallery: "Gallery", generate: "Generate", prompt: "Prompt" }[v]}
            </button>
          ))}
        </div>

        {view === "gallery" && <GalleryView key={kit.id} kitId={kit.id} />}
        {view === "generate" && <GenerateView key={kit.id} kitId={kit.id} />}
        {view === "prompt" && <PromptView key={kit.id} kitId={kit.id} />}
      </main>
    </ThemeProvider>
  );
}

function useKitRenderer(kitId: string) {
  const kit = KITS.find((k) => k.id === kitId)!;
  const [calls, setCalls] = useState<ToolCall[]>([]);
  const [errors, setErrors] = useState<OpenUIError[]>([]);
  const toolProvider = useMemo(
    () =>
      createToolProvider(kit, { onCall: (call) => setCalls((prev) => [...prev.slice(-49), call]) }),
    [kit],
  );
  return {
    kit,
    library: KIT_LIBRARIES[kitId],
    toolProvider,
    calls,
    errors,
    onError: setErrors,
    reset: () => {
      setCalls([]);
      setErrors([]);
    },
  };
}

function GalleryView({ kitId }: { kitId: string }) {
  const { kit, library, toolProvider, calls, errors, onError, reset } = useKitRenderer(kitId);
  const [index, setIndex] = useState(0);
  const dashboard = kit.gallery[index];

  return (
    <section className="view">
      <div className="view__bar">
        <div className="chips">
          {kit.gallery.map((d, i) => (
            <button
              key={d.title}
              type="button"
              className="chip"
              aria-pressed={i === index}
              onClick={() => {
                reset();
                setIndex(i);
              }}
            >
              {d.title}
            </button>
          ))}
        </div>
        <p className="view__hint">
          {dashboard.description} Hand-written, so no model or key is needed.
        </p>
      </div>
      <div className="canvas">
        <Renderer
          key={`${kitId}-${index}`}
          response={dashboard.program}
          library={library}
          isStreaming={false}
          toolProvider={toolProvider}
          onError={onError}
        />
      </div>
      <RunDetails program={dashboard.program} calls={calls} errors={errors} />
    </section>
  );
}

function GenerateView({ kitId }: { kitId: string }) {
  const { kit, library, toolProvider, calls, errors, onError, reset } = useKitRenderer(kitId);
  const [prompt, setPrompt] = useState(kit.starters[0]);
  const [program, setProgram] = useState("");
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [run, setRun] = useState(0);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  async function generate() {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    reset();
    setProgram("");
    setRun((r) => r + 1);
    setStatus("streaming");
    const started = performance.now();
    setMessage("Generating…");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kit: kit.id, prompt }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Generation failed (${response.status})`);
      }
      const model = response.headers.get("X-Model") ?? "model";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setProgram(text);
      }
      setStatus("done");
      setMessage(
        `${model} · ${((performance.now() - started) / 1000).toFixed(1)} s · ${text.length.toLocaleString()} characters`,
      );
    } catch (error) {
      if (controller.signal.aborted) {
        setStatus("idle");
        setMessage("Stopped.");
        return;
      }
      setStatus("error");
      setMessage((error as Error).message);
    }
  }

  return (
    <section className="view">
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          if (status !== "streaming" && prompt.trim()) void generate();
        }}
      >
        <label htmlFor="prompt" className="composer__label">
          Ask for a {kit.name.toLowerCase()} dashboard
        </label>
        <textarea
          id="prompt"
          rows={2}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
        <div className="composer__row">
          <div className="chips">
            {kit.starters.map((starter) => (
              <button
                key={starter}
                type="button"
                className="chip"
                onClick={() => setPrompt(starter)}
              >
                {starter}
              </button>
            ))}
          </div>
          {status === "streaming" ? (
            <button type="button" className="button" onClick={() => abort.current?.abort()}>
              Stop
            </button>
          ) : (
            <button type="submit" className="button button--primary" disabled={!prompt.trim()}>
              Generate
            </button>
          )}
        </div>
        {message && (
          <p
            className={`composer__status${status === "error" ? " composer__status--error" : ""}`}
            role="status"
          >
            {message}
          </p>
        )}
      </form>
      {program ? (
        <>
          <div className="canvas">
            <Renderer
              key={run}
              response={program}
              library={library}
              isStreaming={status === "streaming"}
              toolProvider={toolProvider}
              onError={onError}
            />
          </div>
          <RunDetails program={program} calls={calls} errors={errors} />
        </>
      ) : (
        <div className="canvas canvas--empty">
          The dashboard streams in here. Generation sends the kit&apos;s prompt from the Prompt tab
          to the model; every number then comes from the kit&apos;s tools.
        </div>
      )}
    </section>
  );
}

function RunDetails({
  program,
  calls,
  errors,
}: {
  program: string;
  calls: ToolCall[];
  errors: OpenUIError[];
}) {
  const failed = calls.filter((c) => !c.ok).length;
  return (
    <div className="details">
      <p className="details__summary">
        {calls.length} tool {calls.length === 1 ? "call" : "calls"}
        {failed > 0 && <span className="details__bad"> · {failed} failed</span>}
        {" · "}
        {errors.length === 0 ? (
          "no renderer errors"
        ) : (
          <span className="details__bad">
            {errors.length} renderer {errors.length === 1 ? "error" : "errors"}
          </span>
        )}
      </p>
      {errors.length > 0 && (
        <ul className="details__errors">
          {errors.map((error, i) => (
            <li key={i}>
              <code>{error.code}</code> {error.message}
            </li>
          ))}
        </ul>
      )}
      <details>
        <summary>Tool calls</summary>
        <ul className="details__calls">
          {calls.map((call, i) => (
            <li key={i}>
              <code>{call.tool}</code> {JSON.stringify(call.args)} · {call.ms} ms
              {call.ok ? "" : " · failed"}
            </li>
          ))}
        </ul>
      </details>
      <details>
        <summary>openui-lang program</summary>
        <pre className="code">{program}</pre>
      </details>
    </div>
  );
}

function PromptView({ kitId }: { kitId: string }) {
  const kit = KITS.find((k) => k.id === kitId)!;
  const library = KIT_LIBRARIES[kitId];
  const [data, setData] = useState<{
    prompt: string;
    tools: { name: string; description?: string }[];
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/prompt?kit=${kitId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Prompt failed (${r.status})`))))
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [kitId]);

  const kitGroup = library.componentGroups?.at(-1);
  return (
    <section className="view">
      <div className="stats">
        <Stat
          label="Components"
          value={`${Object.keys(library.components).length}`}
          detail={`${kitGroup?.components.length ?? 0} from this kit`}
        />
        <Stat label="Data tools" value={`${kit.tools.length}`} detail="read-only, via Query()" />
        <Stat label="Examples" value={`${kit.gallery.length}`} detail="the gallery dashboards" />
        <Stat
          label="System prompt"
          value={data ? `${(data.prompt.length / 1000).toFixed(1)}K` : "…"}
          detail="characters"
        />
      </div>
      {error && <p className="composer__status composer__status--error">{error}</p>}
      <div className="prompt-grid">
        <div>
          <h2>Kit components</h2>
          <ul className="plain-list">
            {kitGroup?.components.map((name) => (
              <li key={name}>
                <code>{name}</code> {library.components[name]?.description}
              </li>
            ))}
          </ul>
          <h2>Data tools</h2>
          <ul className="plain-list">
            {data?.tools.map((tool) => (
              <li key={tool.name}>
                <code>{tool.name}</code> {tool.description}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>System prompt</h2>
          <pre className="code code--tall">{data?.prompt ?? "Loading…"}</pre>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      <span className="stat__detail">{detail}</span>
    </div>
  );
}
