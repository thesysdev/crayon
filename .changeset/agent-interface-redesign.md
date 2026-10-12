---
"@openuidev/react-ui": patch
---

Refresh the AgentInterface shell: a collapsed sidebar rail with a History menu and a draggable, remembered width; a pill composer and a shared ~72ch reading column; a centred welcome screen with starter tabs and a `card` starter variant; `AgentInterface.ThreadHeader` gains `start` / `center` / `end` slots, the chat title and a Rename/Delete menu; a Rename option in the thread menu; a shared menu style for Select, ModelSwitcher and dropdowns; a mascot loader in place of the dot-matrix loader; an exported `WelcomeMascot` (blinks, follows the cursor, squishes on click); and server-rendering support: the saved sidebar and theme preferences are restored just after hydration, before paint, with the interface's contents hidden until then so the first visible frame is already correct.
