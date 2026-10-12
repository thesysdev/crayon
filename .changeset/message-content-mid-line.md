---
"@openuidev/lang-core": patch
"@openuidev/react-lang": patch
"@openuidev/react-ui": patch
---

`parseMessage` reads a content line that starts mid-line as a new content section, so a regenerated response wins over the cut-off one, also while streaming. react-lang and react-ui drop their own copies of this step, and a Cloud response keeps the second attempt's scripts.
