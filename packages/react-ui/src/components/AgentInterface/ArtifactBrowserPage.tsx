import {
  useArtifactCategories,
  useArtifactStorage,
  type ArtifactSummary,
} from "@openuidev/react-headless";
import { FileText, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../Button";
import { artifactViewPath } from "./_shared/artifactPaths";
import { useNav } from "./_shared/navContext";

const SEARCH_DEBOUNCE_MS = 300;

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

  const category = categoryName
    ? categories.find((c) => c.name === categoryName)
    : undefined;
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
      <div className="openui-agent-artifact-browser__header">
        <h2 className="openui-agent-artifact-browser__title">{categoryName ?? "Artifacts"}</h2>
        <div className="openui-agent-artifact-browser__search">
          <Search size={14} className="openui-agent-artifact-browser__search-icon" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title"
            className="openui-agent-artifact-browser__search-input"
            aria-label="Search artifacts by title"
          />
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
        {artifacts.map((artifact) => (
          <button
            key={artifact.id}
            type="button"
            className="openui-agent-artifact-browser__item"
            onClick={() => navigate(artifactViewPath(categoryName, artifact.id))}
          >
            <FileText size={16} className="openui-agent-artifact-browser__item-icon" />
            <span className="openui-agent-artifact-browser__item-title">{artifact.title}</span>
          </button>
        ))}
        {isLoading && <div className="openui-agent-artifact-browser__loading">Loading…</div>}
        {!isLoading && nextCursor !== undefined && (
          <Button variant="secondary" size="small" onClick={loadMore}>
            Load more
          </Button>
        )}
      </div>
    </div>
  );
};
