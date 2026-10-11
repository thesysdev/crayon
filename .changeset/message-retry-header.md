---
"@openuidev/lang-core": patch
"@openuidev/react-lang": patch
"@openuidev/react-ui": patch
---

`parseMessage` reads a content line that starts mid-line (OpenUI Cloud's sanitizer retry) as a new content section, so the retry wins, also while streaming. react-lang and react-ui drop their own copies of this step, and a Cloud response keeps the retry's scripts.
