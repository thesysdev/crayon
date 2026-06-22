import {
  useArtifactCategories,
  useArtifactStorage,
  type ArtifactSummary,
} from "@openuidev/react-headless";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { artifactListPath, artifactViewPath } from "./_shared/artifactPaths";
import { useNav } from "./_shared/navContext";

const SEARCH_DEBOUNCE_MS = 300;

export type ArtifactPreviewKind = "app" | "report" | "slide";

const ARTIFACT_PREVIEW_KIND_BY_TYPE: Record<string, ArtifactPreviewKind> = {
  th_dashboard: "app",
  th_report: "report",
  th_presentation: "slide",
};

const ARTIFACT_TYPE_LABEL_BY_TYPE: Record<string, string> = {
  th_dashboard: "App",
  th_report: "Report",
  th_presentation: "Presentation",
};

export const formatArtifactUpdatedAt = (updatedAt: ArtifactSummary["updatedAt"]) => {
  if (updatedAt === undefined) return undefined;
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
};

export const getArtifactPreviewKind = (artifact: { type: string }): ArtifactPreviewKind => {
  const exactKind = ARTIFACT_PREVIEW_KIND_BY_TYPE[artifact.type];
  if (exactKind) return exactKind;

  const normalizedType = artifact.type.toLowerCase();
  if (normalizedType.includes("presentation") || normalizedType.includes("slide")) {
    return "slide";
  }
  if (normalizedType.includes("report") || normalizedType.includes("document")) {
    return "report";
  }
  return "app";
};

export const getArtifactTypeLabel = (artifact: { type: string }) =>
  ARTIFACT_TYPE_LABEL_BY_TYPE[artifact.type] ?? artifact.type;

export const ArtifactPreviewIllustration = ({
  className,
  kind,
}: {
  className?: string;
  kind: ArtifactPreviewKind;
}) => {
  const illustrationClassName = [
    "openui-agent-artifact-browser__preview-illustration",
    `openui-agent-artifact-browser__preview-illustration--${kind}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (kind === "report") {
    return (
      <div className={illustrationClassName} aria-hidden="true">
        <div className="openui-agent-artifact-browser__preview-canvas">
          <div className="openui-agent-artifact-browser__report-paper">
            <div className="openui-agent-artifact-browser__report-lines">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "slide") {
    return (
      <div className={illustrationClassName} aria-hidden="true">
        <div className="openui-agent-artifact-browser__preview-canvas">
          <div className="openui-agent-artifact-browser__slide-lines">
            <span />
            <span />
            <span />
          </div>
          <div className="openui-agent-artifact-browser__slide-visual">
            <span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={illustrationClassName} aria-hidden="true">
      <div className="openui-agent-artifact-browser__preview-canvas">
        <div className="openui-agent-artifact-browser__app-lines">
          <span />
          <span />
        </div>
        <div className="openui-agent-artifact-browser__app-panels">
          <div className="openui-agent-artifact-browser__app-panel">
            <span />
            <span />
            <span />
          </div>
          <div className="openui-agent-artifact-browser__app-panel openui-agent-artifact-browser__app-panel--bleed" />
        </div>
      </div>
    </div>
  );
};

const ArtifactBrowserCard = ({
  artifact,
  updatedAt,
  onClick,
}: {
  artifact: ArtifactSummary;
  updatedAt?: string;
  onClick: () => void;
}) => {
  const previewKind = getArtifactPreviewKind(artifact);
  const typeLabel = getArtifactTypeLabel(artifact);
  const metadata = [typeLabel, updatedAt].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      className={`openui-agent-artifact-browser__item openui-agent-artifact-browser__item--${previewKind}`}
      onClick={onClick}
    >
      <ArtifactPreviewIllustration kind={previewKind} />
      <div className="openui-agent-artifact-browser__item-meta">
        <span className="openui-agent-artifact-browser__item-title">{artifact.title}</span>
        {metadata && (
          <span className="openui-agent-artifact-browser__item-updated-at">{metadata}</span>
        )}
      </div>
    </button>
  );
};

/**
 * Full-page searchable artifact list for one category (reserved path
 * `artifacts/{category}`). Title search + category type filter are applied
 * server-side via `ArtifactStorage.list`; pagination via cursor.
 *
 * Internal — rendered by AgentInterface when the current path matches the
 * reserved `artifacts/` prefix.
 *
 * @internal
 */
export const ArtifactBrowserPage = ({ categoryName }: { categoryName?: string }) => {
  const storage = useArtifactStorage();
  const categories = useArtifactCategories();
  const { navigate } = useNav();

  const category = categoryName ? categories.find((c) => c.name === categoryName) : undefined;
  // A named category that matches no configured category (stale/renamed path,
  // hand-edited or bookmarked URL). Distinct from `all` (categoryName undefined),
  // which intentionally lists everything. `categories` is static config, so this
  // is decided synchronously with no loading race.
  const notFound = categoryName !== undefined && category === undefined;
  const typeFilter = category?.filter.type;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [artifacts, setArtifacts] = useState<ArtifactSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const typeKey = typeFilter?.join(" ");
  const emptyPreviewKind = categoryName === "Apps" ? "app" : "report";
  const emptyItemLabel = categoryName === "Apps" ? "apps" : "artifacts";
  const emptyMessage = debouncedSearch
    ? `No ${emptyItemLabel} match your search`
    : `No ${emptyItemLabel} yet`;

  // Initial page + reload on search/category change.
  useEffect(() => {
    if (!storage || notFound) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    storage
      .list({
        name: debouncedSearch || undefined,
        type: typeKey === undefined ? undefined : typeKey.split(" "),
      })
      .then(({ artifacts: page, nextCursor: cursor }) => {
        if (requestId !== requestIdRef.current) return;
        setArtifacts(page);
        setNextCursor(cursor);
        setIsLoading(false);
      })
      .catch((e) => {
        if (requestId !== requestIdRef.current) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setIsLoading(false);
      });
  }, [storage, debouncedSearch, typeKey, notFound]);

  const loadMore = () => {
    if (!storage || nextCursor === undefined || isLoading) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    storage
      .list({
        name: debouncedSearch || undefined,
        type: typeKey === undefined ? undefined : typeKey.split(" "),
        cursor: nextCursor,
      })
      .then(({ artifacts: page, nextCursor: cursor }) => {
        if (requestId !== requestIdRef.current) return;
        setArtifacts((prev) => [...prev, ...page]);
        setNextCursor(cursor);
        setIsLoading(false);
      })
      .catch((e) => {
        if (requestId !== requestIdRef.current) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setIsLoading(false);
      });
  };

  if (!storage) return null;

  if (notFound) {
    return (
      <div className="openui-agent-artifact-browser">
        <div className="openui-agent-artifact-browser__content">
          <div className="openui-agent-artifact-browser__header">
            <h2 className="openui-agent-artifact-browser__title">Artifacts</h2>
          </div>
          <div className="openui-agent-artifact-browser__list">
            <div className="openui-agent-artifact-browser__empty">
              <ArtifactPreviewIllustration
                className="openui-agent-artifact-browser__empty-illustration"
                kind="report"
              />
              <span className="openui-agent-artifact-browser__empty-text">
                No category named “{categoryName}”
              </span>
              <Button variant="secondary" size="small" onClick={() => navigate(artifactListPath())}>
                View all artifacts
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="openui-agent-artifact-browser">
      <div className="openui-agent-artifact-browser__content">
        <div className="openui-agent-artifact-browser__header">
          <h2 className="openui-agent-artifact-browser__title">{categoryName ?? "Artifacts"}</h2>
          <div className="openui-agent-artifact-browser__search">
            <Search size={14} className="openui-agent-artifact-browser__search-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title"
              className="openui-agent-artifact-browser__search-input"
              aria-label="Search artifacts by title"
            />
            {search && (
              <IconButton
                size="2-extra-small"
                variant="tertiary"
                icon={<X size="1em" />}
                aria-label="Clear search"
                onClick={() => setSearch("")}
              />
            )}
          </div>
        </div>

        <div className="openui-agent-artifact-browser__list">
          {error && (
            <div className="openui-agent-artifact-browser__error">
              Failed to load artifacts: {error.message}
            </div>
          )}
          {!error && artifacts.length === 0 && !isLoading && (
            <div className="openui-agent-artifact-browser__empty">
              <ArtifactPreviewIllustration
                className="openui-agent-artifact-browser__empty-illustration"
                kind={emptyPreviewKind}
              />
              <span className="openui-agent-artifact-browser__empty-text">{emptyMessage}</span>
            </div>
          )}
          {artifacts.map((artifact) => {
            const updatedAt = formatArtifactUpdatedAt(artifact.updatedAt);
            return (
              <ArtifactBrowserCard
                key={artifact.id}
                artifact={artifact}
                updatedAt={updatedAt}
                onClick={() => navigate(artifactViewPath(categoryName, artifact.id))}
              />
            );
          })}
          {isLoading && <div className="openui-agent-artifact-browser__loading">Loading…</div>}
          {!isLoading && nextCursor !== undefined && (
            <div className="openui-agent-artifact-browser__load-more">
              <Button variant="secondary" size="small" onClick={loadMore}>
                Load more
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
