import {
  fetchLLM,
  type ChatLLM,
  type FetchLLMOptions,
  type StreamProtocolAdapter,
} from "@openuidev/react-headless";
import { agnoAGUIAdapter } from "./adapter";

export interface CreateAgnoLLMOptions extends Omit<FetchLLMOptions, "body" | "streamAdapter"> {
  /** Bearer token for an authenticated AgentOS. Explicit Authorization headers win. */
  token?: string;
  /** Initial AG-UI state sent to AgentOS. Defaults to an empty object. */
  state?: Record<string, unknown>;
  /** AgentOS forwarding fields such as user_id. Defaults to an empty object. */
  forwardedProps?: Record<string, unknown>;
  /** Additional RunAgentInput fields merged before the required Agno fields. */
  body?: Record<string, unknown>;
  /** Override the Agno-aware stream adapter. */
  streamAdapter?: StreamProtocolAdapter;
}

/**
 * Create an OpenUI ChatLLM backed by an Agno AgentOS AG-UI endpoint.
 *
 * The helper supplies the extension containers required by AgentOS and uses
 * the Agno-aware AG-UI adapter by default. AgentOS still owns model execution,
 * tools, sessions, and authorization; OpenUI owns the browser UI.
 */
export function createAgnoLLM({
  token,
  state = {},
  forwardedProps = {},
  body,
  headers,
  streamAdapter = agnoAGUIAdapter(),
  ...options
}: CreateAgnoLLMOptions): ChatLLM {
  return fetchLLM({
    ...options,
    streamAdapter,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: {
      ...body,
      state,
      forwardedProps,
    },
  });
}
