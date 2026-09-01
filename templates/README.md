# CLI templates

Starter apps for `openui create`. The CLI copies a template from this directory when it can see the OpenUI repo, and otherwise sparse-checkouts it from GitHub.

| Directory | `--template` |
| --- | --- |
| `openui-cloud/` | `openui-cloud` (interactive default) |
| `openui-self-hosted/` | `openui-self-hosted` |

Backend framework options come from each template's `overlays/` directory plus `default` (the base template with no overlay). Add an overlay by creating `overlays/<name>/` with a `manifest.json`.
