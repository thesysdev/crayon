---
"@openuidev/cli": patch
---

Remove the agent-skill installation step from `create`, along with its `--skill` and `--no-skill` flags. When a coding agent runs `create`, the closing message now ends by pointing it at the new project's README, which links to the OpenUI skill for coding agents.
