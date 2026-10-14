---
"@openuidev/cli": patch
---

Stop `create` and `deploy` from hanging or failing when a coding agent or a non-interactive shell runs them. Agents are detected from `--agent-name`, known harness env markers, or `AI_AGENT`. With nobody to answer prompts, a plain `create` now takes the defaults (OpenUI Cloud template, LangGraph, `openui-agent` or the next free name) instead of erroring on a missing `--template`, skips Cloud sign-in, and ends with a `generate-api-key` hint that uses the invoking package manager. `deploy` never prompts for agents: it stops when Vercel login is needed and only links or saves env with `--yes`.
