---
"@openuidev/react-lang": patch
---

The React Native entry now renders React Native primitives instead of DOM elements. `Renderer`, its slots, and `WithPreviewRenderer` used to mount `<div>`/`<button>`/`<section>` on native, which crashed Metro with "View config getter callback for component `div` must be a function". The native build now uses `View`, `Pressable`, and `ActivityIndicator`, with slot props typed for React Native (`onPress`, `View` styles). `react-native` is an optional peer dependency. Web is unchanged.
