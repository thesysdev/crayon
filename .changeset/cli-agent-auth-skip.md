---
"@openuidev/cli": patch
---

Stop `create` from hanging or failing when a coding agent or a non-interactive shell runs it. Agents are detected from `--agent-name` or, via `@vercel/detect-agent` plus a few extra markers, from the environment their harness sets. With nobody to answer prompts, a plain `create` now takes the defaults (OpenUI Cloud template, LangGraph, `openui-agent` or the next free name) instead of erroring on a missing `--template`, skips Cloud sign-in, and ends with a `generate-api-key` hint that uses the invoking package manager.
