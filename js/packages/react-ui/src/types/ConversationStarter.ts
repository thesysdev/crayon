import { ReactNode } from "react";

/**
 * Icon type for conversation starters
 * - undefined: Show default lightbulb icon
 * - "": Show no icon
 * - ReactNode: Show the provided icon
 */
export type ConversationStarterIcon = ReactNode | "";

interface ConversationStarterProps {
  displayText: string;
  prompt: string;
  /**
   * Optional icon to display
   * - If not provided (undefined): shows default lightbulb icon
   * - If empty string (""): shows no icon
   * - Otherwise: shows the provided React element
   */
  icon?: ConversationStarterIcon;
}

export type { ConversationStarterProps };
