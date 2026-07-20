"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger, Tag } from "@openuidev/react-ui";
import { useMemo, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useMediaQuery } from "@paste/hooks/useMediaQuery";
import { useValidation } from "@paste/hooks/useValidation";
import { useVersionList } from "@paste/hooks/useVersionList";
import { DEFAULT_EXAMPLE } from "@paste/lib/examples";
import { getRootName, getSchema, type LibraryId } from "@paste/lib/libraries";
import { usePlayback } from "@paste/lib/streaming/usePlayback";
import { BUNDLED_LANG_CORE_VERSION } from "@paste/lib/versions/loader";
import { Banner } from "./Banner";
import { EditorPane } from "./EditorPane";
import { RenderErrorBoundary } from "./RenderErrorBoundary";
import { JsonPanel } from "./panels/JsonPanel";
import { RenderPanel } from "./panels/RenderPanel";
import { StreamTimeline } from "./panels/StreamTimeline";
import { TreePanel } from "./panels/TreePanel";
import { ValidationPanel } from "./panels/ValidationPanel";
import { Toasts, type ToastItem } from "./Toasts";
import { Toolbar } from "./Toolbar";

type Tab = "render" | "validation" | "tree" | "json" | "stream";

const TABS: { id: Tab; label: string }[] = [
  { id: "render", label: "Render" },
  { id: "validation", label: "Validation" },
  { id: "tree", label: "Tree" },
  { id: "json", label: "JSON" },
  { id: "stream", label: "Stream" },
];

const BIG_INPUT_BYTES = 200 * 1024;
const CHAR_STRATEGY_LIMIT = 50 * 1024;

export function Playground() {
  const [code, setCode] = useState(DEFAULT_EXAMPLE.code);
  const [libraryId, setLibraryId] = useState<LibraryId>("openui");
  // null = "no explicit pick yet" → follow the registry's latest tag.
  const [pickedVersion, setPickedVersion] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("render");

  const versions = useVersionList();
  const version = pickedVersion ?? versions.list.latest ?? BUNDLED_LANG_CORE_VERSION;
  const { outcome, loaded, loadingVersion } = useValidation(code, version, libraryId);

  const schema = useMemo(() => getSchema(libraryId), [libraryId]);
  const componentDefs = useMemo(
    () => (schema as { $defs?: import("@paste/lib/editor/hover").ComponentDefs })?.$defs ?? null,
    [schema],
  );
  const rootName = getRootName(libraryId);
  const playback = usePlayback(code, loaded, schema, rootName);

  const playbackActive = playback.state.status === "playing" || playback.state.status === "paused";
  const isStreaming = playback.state.status === "playing";
  // Editor stacks above the output on narrow screens (split flips vertical).
  const narrow = useMediaQuery("(max-width: 860px)");

  // Streaming playback takes over all panels while it owns the parse state.
  const displayed = playbackActive || playback.state.status === "done"
    ? { result: playback.state.result, enriched: null, fatal: playback.state.fatal }
    : outcome;
  const renderedCode = playbackActive ? playback.state.prefix : code;

  const changeCode = (next: string) => {
    if (playback.state.status !== "idle") playback.reset();
    setCode(next);
  };

  const loadExample = (exampleCode: string) => {
    changeCode(exampleCode);
  };

  const toasts: ToastItem[] = [];
  if (versions.loading)
    toasts.push({ id: "versions", text: "Fetching lang-core versions from npm…", spinning: true });
  if (loadingVersion)
    toasts.push({ id: "load", text: `Loading lang-core ${version} from CDN…`, spinning: true });

  return (
    <div className="playground">
      <Toolbar
        libraryId={libraryId}
        onLibraryChange={(id) => {
          if (playback.state.status !== "idle") playback.reset();
          setLibraryId(id);
        }}
        version={version}
        onVersionChange={(v) => {
          if (playback.state.status !== "idle") playback.reset();
          setPickedVersion(v);
        }}
        versions={versions}
        loaded={loaded}
        onLoadExample={loadExample}
        playback={playback}
        bigInput={code.length > CHAR_STRATEGY_LIMIT}
      />

      {loaded && !loaded.compatible && (
        <Banner tone="danger">
          lang-core {loaded.version} is incompatible with this playground ({loaded.reason}) —
          validation is running on the bundled {BUNDLED_LANG_CORE_VERSION} instead.
        </Banner>
      )}
      {loaded && loaded.compatible && loaded.source === "bundled" && version !== BUNDLED_LANG_CORE_VERSION && (
        <Banner tone="warning">
          Could not load lang-core {version} from a CDN — validating with the bundled{" "}
          {BUNDLED_LANG_CORE_VERSION}.
        </Banner>
      )}
      {code.length > BIG_INPUT_BYTES && (
        <Banner tone="warning">
          Large input ({Math.round(code.length / 1024)} KB) — validation may feel sluggish.
        </Banner>
      )}

      <Group orientation={narrow ? "vertical" : "horizontal"} className="main-split">
        {/* v4: unitless strings are percentages; numbers would mean pixels */}
        <Panel defaultSize="45%" minSize="25%" className="split-panel">
          <EditorPane
            code={code}
            onChange={changeCode}
            readOnly={playbackActive}
            componentDefs={componentDefs}
          />
        </Panel>
        <Separator className="resize-handle" />
        <Panel minSize="30%" className="split-panel">
          <RenderErrorBoundary
            resetKey={`${version}:${libraryId}:${code}`}
            title="Output panel crashed"
            hint="This is usually an incompatibility with the selected lang-core version — pick a different version or edit the code to recover."
          >
            <div className="output-pane">
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as Tab)}
              className="output-tabs"
              variant="clear"
            >
              <div className="tab-strip">
                <TabsList variant="title">
                  {TABS.map((t) => (
                    <TabsTrigger
                      key={t.id}
                      value={t.id}
                      text={
                        t.id === "validation" && displayed.result
                          ? `${t.label} (${displayed.result.meta.errors.length})`
                          : t.label
                      }
                    />
                  ))}
                </TabsList>
                {loadingVersion && <Tag size="sm" variant="neutral" text="loading lang-core…" />}
              </div>
              <TabsContent value="render" className="tab-body">
                <RenderPanel
                  key={libraryId}
                  code={renderedCode}
                  libraryId={libraryId}
                  isStreaming={isStreaming}
                  selectedVersion={loaded?.version ?? version}
                />
              </TabsContent>
              <TabsContent value="validation" className="tab-body">
                <ValidationPanel outcome={displayed} />
              </TabsContent>
              <TabsContent value="tree" className="tab-body">
                <TreePanel result={displayed.result} />
              </TabsContent>
              <TabsContent value="json" className="tab-body">
                <JsonPanel result={displayed.result} />
              </TabsContent>
              <TabsContent value="stream" className="tab-body">
                <StreamTimeline state={playback.state} />
              </TabsContent>
            </Tabs>
          </div>
          </RenderErrorBoundary>
        </Panel>
      </Group>
      <Toasts items={toasts} />
    </div>
  );
}
