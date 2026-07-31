import { ReactNode } from "react";
import { ConversationStarterProps } from "./ConversationStarter";

/**
 * A fill-in-the-blank prompt for the welcome screen, rendered as a chip:
 * clicking drops the incomplete `prompt` stem into the welcome composer
 * (instead of sending), then shows the template's `completions`, which append
 * to the draft on click.
 */
export interface PromptTemplate {
  displayText: string;
  /** The prompt stem dropped into the composer, e.g. "Create a deck about ". */
  prompt: string;
  /** Optional icon; omit for none (chips render no default icon). */
  icon?: ReactNode;
  /** Suggested completions shown once this template is in the composer. */
  completions: ConversationStarterProps[];
}
