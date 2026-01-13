import { ReactNode } from "react";

/**
 * Icon type for conversation starters
 * - undefined: Show default lightbulb icon
 * - ReactNode: Show the provided icon (use <></> or React.Fragment for no icon)
 */
export type ConversationStarterIcon = ReactNode;

interface ConversationStarterProps {
  displayText: string;
  prompt: string;
  /**
   * Optional icon to display
   * - If not provided (undefined): shows default lightbulb icon
   * - If provided: shows the provided React element
   * - For no icon: pass an empty fragment (<></> or React.Fragment)
   */
  icon?: ConversationStarterIcon;
}

export type { ConversationStarterProps };
