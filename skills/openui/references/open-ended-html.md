# Open-ended HTML

Use this pattern when the user wants full generative UI, generated mini-apps, raw HTML, or a sandboxed iframe rather than a fixed component catalog.

The canonical implementation is [`examples/html-artifact`](https://github.com/thesysdev/openui/tree/main/examples/html-artifact).

## Pattern

1. Define one OpenUI component with `title` and `document` string props.
2. Put it alongside any library (the example uses a minimal one with just a markdown/text component and a plain container root) — the model chooses per reply whether to emit an artifact. Do NOT make the artifact the root: that forces every reply to be an HTML page.
3. Generate the system prompt with `openui generate`.
4. Pass that library to `AgentInterface.componentLibrary`.
5. Use `useIsStreaming()` to distinguish incoming source from the completed document.
6. Keep only a compact status preview inline.
7. Open a `DetailedViewPanel` containing Raw and Rendered tabs.
8. Show source in Raw, a loading state in Rendered while streaming, and a sandboxed `iframe srcDoc` when complete.

Use the existing assistant response stream. Do not add another streaming endpoint or a tool unless the user's application independently requires one.

## Prompt contract

Tell the model to:

- use the markdown component for normal conversation, and the artifact only when asked to build something interactive;
- emit a self-contained HTML document or fragment;
- use inline CSS and JavaScript;
- avoid external resources and network requests;
- omit Markdown fences;
- escape newlines, quotes, and backslashes for the OpenUI Lang string.

Keep one valid example in `promptOptions.examples`, then regenerate the checked-in system prompt.

## Security

Treat generated HTML as untrusted. Before production, normalize and validate it, enforce a Content Security Policy, restrict network access, keep iframe sandbox permissions narrow, and validate iframe messages.
