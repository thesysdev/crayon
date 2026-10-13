---
"@openuidev/lang-core": patch
---

Accept Python-style triple-quoted strings (`"""…"""` / `'''…'''`) for multi-line values such as code snippets, including while streaming. Quotes inside `//` and `#` comments no longer throw off string detection.
