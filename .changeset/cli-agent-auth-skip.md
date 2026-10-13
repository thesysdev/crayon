---
"@openuidev/cli": patch
---

Stop `create` and `deploy` from hanging when a coding agent or a non-interactive shell runs them. Agents are detected from `--agent-name`, known harness env markers, or `AI_AGENT`. `create` skips OpenUI Cloud sign-in in that case and ends with a `generate-api-key` hint that uses the invoking package manager; `deploy` skips prompts (without implying `--yes`) and fails fast when Vercel login is needed.
