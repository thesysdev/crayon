import {
  useArtifactCategories,
  useArtifactStorage,
  type ArtifactSummary,
} from "@openuidev/react-headless";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../Button";
import { artifactViewPath } from "./_shared/artifactPaths";
import { useNav } from "./_shared/navContext";

const SEARCH_DEBOUNCE_MS = 300;

type ArtifactPreviewKind = "app" | "report" | "slide";

const ARTIFACT_PREVIEW_KIND_BY_TYPE: Record<string, ArtifactPreviewKind> = {
  th_dashboard: "app",
  th_report: "report",
  th_presentation: "slide",
};

const formatArtifactUpdatedAt = (updatedAt: ArtifactSummary["updatedAt"]) => {
  if (updatedAt === undefined) return undefined;
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
};

const getArtifactPreviewKind = (artifact: ArtifactSummary): ArtifactPreviewKind => {
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

const ArtifactPreviewIllustration = ({
  kind,
  title,
}: {
  kind: ArtifactPreviewKind;
  title: string;
}) => {
  if (kind === "report") {
    return (
      <div
        className="openui-agent-artifact-browser__preview-illustration openui-agent-artifact-browser__preview-illustration--report"
        aria-hidden="true"
      >
        <div className="openui-agent-artifact-browser__preview-canvas">
          <div className="openui-agent-artifact-browser__report-paper">
            <div className="openui-agent-artifact-browser__preview-title">{title}</div>
            <div className="openui-agent-artifact-browser__report-lines">
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
      <div
        className="openui-agent-artifact-browser__preview-illustration openui-agent-artifact-browser__preview-illustration--slide"
        aria-hidden="true"
      >
        <div className="openui-agent-artifact-browser__preview-canvas">
          <div className="openui-agent-artifact-browser__slide-title">{title}</div>
          <svg
            className="openui-agent-artifact-browser__slide-shape"
            width="67"
            height="71"
            viewBox="0 0 67 71"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M43.152 54.6609C43.5443 54.857 43.8844 55.1436 44.1442 55.497C44.404 55.8503 44.5761 56.2604 44.6464 56.6934C44.7166 57.1263 44.683 57.5698 44.5482 57.9872C44.4135 58.4046 44.1814 58.784 43.8713 59.0941L24.2985 78.6668C23.9884 78.977 23.609 79.2091 23.1916 79.3438C22.7742 79.4786 22.3307 79.5122 21.8978 79.442C21.4648 79.3717 21.0547 79.1996 20.7014 78.9398C20.348 78.68 20.0614 78.3399 19.8653 77.9476L0.292509 38.802C0.032543 38.2824 -0.0572981 37.6941 0.0357161 37.1205C0.12873 36.547 0.399883 36.0172 0.810751 35.6064C1.22162 35.1955 1.75137 34.9243 2.32493 34.8313C2.89849 34.7383 3.48678 34.8281 4.00644 35.0881L43.152 54.6609ZM40.9353 5.26902C38.4191 2.75279 35.2132 1.03921 31.7231 0.344985C28.233 -0.349241 24.6154 0.00706225 21.3278 1.36884C18.0402 2.73061 15.2302 5.0367 13.2532 7.99547C11.2762 10.9542 10.221 14.4328 10.221 17.9913C10.221 21.5498 11.2762 25.0284 13.2532 27.9871C15.2302 30.9459 18.0402 33.252 21.3278 34.6138C24.6154 35.9756 28.233 36.3319 31.7231 35.6376C35.2132 34.9434 38.4191 33.2298 40.9353 30.7136C44.3044 27.3367 46.1965 22.7614 46.1965 17.9913C46.1965 13.2212 44.3044 8.64587 40.9353 5.26902ZM61.4867 17.9913L39.9567 39.5213C39.4376 40.0404 39.146 40.7445 39.146 41.4786C39.146 42.2127 39.4376 42.9168 39.9567 43.4359L53.6576 57.1368C54.1767 57.6559 54.8808 57.9475 55.6149 57.9475C56.349 57.9475 57.0531 57.6559 57.5722 57.1368L79.1022 35.6068C79.6213 35.0877 79.9129 34.3836 79.9129 33.6495C79.9129 32.9154 79.6213 32.2113 79.1022 31.6922L65.4013 17.9913C64.8822 17.4722 64.1781 17.1806 63.444 17.1806C62.7099 17.1806 62.0058 17.4722 61.4867 17.9913Z"
              fill="currentColor"
              fillOpacity="0.06"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div
      className="openui-agent-artifact-browser__preview-illustration openui-agent-artifact-browser__preview-illustration--app"
      aria-hidden="true"
    >
      <div className="openui-agent-artifact-browser__preview-canvas">
        <div className="openui-agent-artifact-browser__app-title">{title}</div>
        <div className="openui-agent-artifact-browser__app-grid">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="openui-agent-artifact-browser__app-footer">
          <span />
          <span />
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

  return (
    <button
      type="button"
      className={`openui-agent-artifact-browser__item openui-agent-artifact-browser__item--${previewKind}`}
      onClick={onClick}
    >
      <ArtifactPreviewIllustration kind={previewKind} title={artifact.title} />
      <div className="openui-agent-artifact-browser__item-meta">
        <span className="openui-agent-artifact-browser__item-title">{artifact.title}</span>
        {updatedAt && (
          <span className="openui-agent-artifact-browser__item-updated-at">{updatedAt}</span>
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

  // Initial page + reload on search/category change.
  useEffect(() => {
    if (!storage) return;
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
  }, [storage, debouncedSearch, typeKey]);

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
              <button
                type="button"
                aria-label="Clear search"
                className="openui-agent-artifact-browser__search-clear"
                onClick={() => setSearch("")}
              >
                <X size="1em" />
              </button>
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
              {debouncedSearch ? "No artifacts match your search." : "No artifacts yet."}
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
