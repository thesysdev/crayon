/**
 * Joins a contextual-starter prompt onto the current draft, inserting a single
 * space separator unless the draft is empty or already ends with a space.
 * (Prefill chips end their prompt with a trailing space on purpose.)
 */
export const appendStarterPrompt = (draft: string, prompt: string): string => {
  const separator = draft.length > 0 && !draft.endsWith(" ") ? " " : "";
  return `${draft}${separator}${prompt}`;
};
