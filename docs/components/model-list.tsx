"use client";

import { CopyableModelId } from "@/components/copyable-model-id";
import { cn } from "@/lib/cn";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const MODELS_URL = "https://openrouter.ai/api/v1/models";

const PROVIDERS = [
  { group: "openai", prefix: "openai/", label: "OpenAI" },
  { group: "anthropic", prefix: "anthropic/", label: "Anthropic" },
  { group: "gemini", prefix: "google/gemini", label: "Gemini" },
] as const;

type ModelGroup = (typeof PROVIDERS)[number]["group"] | "other";

type Model = {
  id: string;
  name: string;
  created: number;
  context_length: number | null;
  pricing: { prompt?: string; completion?: string };
  architecture: { output_modalities: string[] };
};

// Alias IDs such as "~openai/gpt-sol-latest" carry a leading "~".
const groupOf = (m: Model): ModelGroup => {
  const id = m.id.replace(/^~/, "");
  return PROVIDERS.find((p) => id.startsWith(p.prefix))?.group ?? "other";
};

// Drops batch variants, OpenAI/Anthropic/Gemini "-latest" aliases, OpenAI pro/chat/codex variants,
// and models that can output images or audio.
// OpenRouter has no field that marks these variants, so the ID is the only signal.
const isListed = (m: Model) =>
  !m.id.endsWith(":batch") &&
  !/^~?(openai\/|anthropic\/|google\/gemini).*-latest$/.test(m.id) &&
  !/^openai\/(.+-pro$|.*(chat|codex))/.test(m.id) &&
  m.architecture.output_modalities.every((modality) => modality === "text");

let modelsRequest: Promise<Model[]> | undefined;

// Every list on the page shares one request.
function loadModels() {
  modelsRequest ??= fetch(MODELS_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<{ data: Model[] }>;
    })
    .then(({ data }) => data.filter(isListed).sort((a, b) => b.created - a.created))
    .catch((error: unknown) => {
      modelsRequest = undefined;
      throw error;
    });
  return modelsRequest;
}

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact" });
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

// OpenRouter prices are USD per token. Routers with dynamic pricing report "-1".
function formatPrice(perToken?: string) {
  if (perToken === undefined) return "-";
  const value = Number(perToken);
  if (value < 0) return "Varies";
  if (value === 0) return "Free";
  return usd.format(value * 1_000_000);
}

export function ModelList({
  group,
  preview = 3,
  pageSize = 10,
}: {
  group: ModelGroup;
  preview?: number;
  pageSize?: number;
}) {
  const [models, setModels] = useState<Model[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    let active = true;
    loadModels()
      .then((all) => {
        if (active) setModels(all.filter((m) => groupOf(m) === group));
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [group]);

  const filtered = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!models || terms.length === 0) return models ?? [];
    return models.filter((m) => {
      const text = `${m.id} ${m.name}`.toLowerCase();
      return terms.every((term) => text.includes(term));
    });
  }, [models, query]);

  if (failed) {
    return (
      <p>
        Could not load the model list. View the{" "}
        <a href="https://openrouter.ai/models">model list on OpenRouter</a> instead.
      </p>
    );
  }
  if (!models) return <p className="text-fd-muted-foreground">Loading models...</p>;

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const start = current * pageSize;
  const rows = expanded ? filtered.slice(start, start + pageSize) : filtered.slice(0, preview);
  const label = PROVIDERS.find((p) => p.group === group)?.label ?? "other";
  const canToggle = expanded || filtered.length > preview;

  return (
    <div className="my-6">
      <div className="not-prose relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fd-muted-foreground"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search by model name or ID"
          aria-label={`Search ${label} models`}
          className="w-full rounded-lg border bg-fd-background py-2 pl-9 pr-3 text-sm placeholder:text-fd-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-fd-muted-foreground">No models match &quot;{query}&quot;.</p>
      ) : (
        <div className="relative overflow-auto prose-no-margin my-4">
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Context</th>
                <th>Input / 1M tokens</th>
                <th>Output / 1M tokens</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="mb-1">{m.name}</div>
                    <CopyableModelId value={m.id} />
                  </td>
                  <td>{m.context_length ? compactNumber.format(m.context_length) : "-"}</td>
                  <td>{formatPrice(m.pricing.prompt)}</td>
                  <td>{formatPrice(m.pricing.completion)}</td>
                </tr>
              ))}
              {canToggle && (
                <tr>
                  <td colSpan={4}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm text-fd-muted-foreground hover:text-fd-foreground"
                      aria-expanded={expanded}
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? (
                        <ChevronUp aria-hidden="true" className="size-4" />
                      ) : (
                        <ChevronDown aria-hidden="true" className="size-4" />
                      )}
                      {expanded ? "Show less" : `Show ${filtered.length - preview} more`}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="not-prose flex flex-wrap items-center justify-between gap-4 text-sm text-fd-muted-foreground">
        {expanded && filtered.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span>
              {start + 1}-{start + rows.length} of {filtered.length}
            </span>
            <button
              type="button"
              className={cn(buttonVariants({ color: "outline", size: "icon-sm" }))}
              aria-label="Previous page"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <span>
              Page {current + 1} of {pageCount}
            </span>
            <button
              type="button"
              className={cn(buttonVariants({ color: "outline", size: "icon-sm" }))}
              aria-label="Next page"
              disabled={current === pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
