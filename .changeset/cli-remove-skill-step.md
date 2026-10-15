---
"@openuidev/cli": minor
---

Remove the agent-skill install step and `--skill` from `create`; `--no-skill` now leaves out the project's `AGENTS.md` and suggests `npx skills add thesysdev/skills` instead. Agent runs point to the project README.
