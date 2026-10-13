---
"@openuidev/react-headless": patch
---

Publish a tool call before its result: `processStreamedMessage` flushes the pending assistant update before a tool result arrives, so a server-side tool's result never shows up ahead of (or without) its call.
