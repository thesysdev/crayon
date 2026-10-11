---
"@openuidev/cli": minor
---

Add `openui auth login`, `auth wait`, and `auth logout` so coding agents can get through sign-in without blocking. When an agent runs the CLI, sign-in starts in the background and the link is printed right away. `auth wait` exits with 0 once signed in, or 75 while sign-in is still pending. The sign-in is saved, so `create` and `generate-api-key` mint keys without opening the browser again until the token expires.
