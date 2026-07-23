import { ReactNode } from "react";
import { ConversationStarterProps } from "./ConversationStarter";

/**
 * A ChatGPT-style prefill chip for the welcome screen: clicking drops
 * `prompt` into the welcome composer (instead of sending), then shows the
 * chip's contextual `starters`, which append to the draft on click.
 */
export interface PrefillChip {
  displayText: string;
  prompt: string;
  /** Optional icon; omit for none (chips render no default icon). */
  icon?: ReactNode;
  /** Contextual starters shown after this chip prefills the composer. */
  starters: ConversationStarterProps[];
}
