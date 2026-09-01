# CLI templates

Starter apps for `openui create`. `templates.json` is the catalog the CLI prefetches from GitHub (`name`, `key`, `description`, `overlays`) to resolve `--template` and `--backend-framework` before copying files. It then sparse-checkouts `templates/<key>/` from `thesysdev/openui`.

| Directory | `--template` |
| --- | --- |
| `openui-cloud/` | `openui-cloud` (interactive default) |
| `openui-self-hosted/` | `openui-self-hosted` |

Add a template by creating `templates/<key>/` and adding an entry to `templates.json`. Overlay keys must match directories under that template's `overlays/` (plus `default` for the base template).
