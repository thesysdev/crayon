import { defineArtifactRenderer, partialJSONParse } from "@openuidev/react-headless";
import { SourceIcon } from "../components/ToolCall/SourceIcon";

/**
 * A single web-search source. Shape matches the typed `sources` field on the
 * tool arguments — no magic `_sources` key.
 */
export interface WebSearchSource {
  sourceTitle: string;
  sourceDescription?: string;
  sourceUrl: string;
  sourceLogoSrc?: string;
}

/** Typed shape read off the tool-call arguments for the web-search tool. */
interface WebSearchInput {
  query?: string;
  reasoning?: string;
  sources?: WebSearchSource[];
}

interface WebSearchProps {
  query: string;
  reasoning?: string;
  sources: WebSearchSource[];
  streaming: boolean;
}

/**
 * Built-in renderer for a web-search tool, matched by tool name. Reads typed
 * `query` / `reasoning` / `sources` off the (pre-parsed) tool-call arguments —
 * no `_type` / `_query` / `_sources` magic keys — and exposes a `preview`
 * sources list + `actual` detailed view. Not auto-registered — add it to
 * `<ChatProvider artifactRenderers={[...]}>`.
 *
 * @category Renderers
 */
export const webSearchRenderer = defineArtifactRenderer<WebSearchProps>({
  type: "th_web_search",
  toolName: ["web_search", "webSearch"],
  parser: ({ args, response }, { isStreaming }) => {
    const raw = typeof args === "string" ? args : (response ?? "");
    const input = (typeof raw === "string" ? partialJSONParse(raw) : (raw ?? {})) as WebSearchInput;
    return {
      props: {
        query: input.query ?? "",
        reasoning: input.reasoning,
        sources: input.sources ?? [],
        streaming: isStreaming,
      },
      meta: null, // inline-only, no artifact-browser registration
    };
  },
  preview: (props, controls) => (
    <div className="openui-tool-call">
      <div className="openui-tool-call__title-row">
        <span
          className={`openui-tool-call__name${
            props.streaming && controls.isStreaming ? " openui-tool-call__name--shimmer" : ""
          }`}
        >
          {props.query}
        </span>
      </div>
      <div className="openui-tool-call__connector openui-tool-call__connector--last">
        <div className="openui-tool-call__args-block">
          {props.reasoning && <p className="openui-tool-call__reasoning">{props.reasoning}</p>}
          <div className="openui-tool-call__sources">
            {props.sources.map((s) => (
              <a
                key={s.sourceUrl}
                className="openui-tool-call__source"
                href={s.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="openui-tool-call__source-left">
                  <SourceIcon src={s.sourceLogoSrc} />
                  <span className="openui-tool-call__source-title">{s.sourceTitle}</span>
                </div>
                <span className="openui-tool-call__source-desc">{s.sourceDescription}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
  actual: (props) => (
    <ul className="openui-web-search__detailed">
      {props.sources.map((s) => (
        <li key={s.sourceUrl}>
          <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">
            <SourceIcon src={s.sourceLogoSrc} /> {s.sourceTitle}
          </a>
          <p>{s.sourceDescription}</p>
        </li>
      ))}
    </ul>
  ),
});
