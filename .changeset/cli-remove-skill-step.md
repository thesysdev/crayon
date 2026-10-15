---
"@openuidev/cli": minor
---

Remove the agent-skill install step and `--skill` from `create`. New projects now get an `AGENTS.md` copied from the OpenUI skill; `--no-skill` leaves it out and suggests `npx skills add thesysdev/skills` instead. Agent runs point to the project README.
