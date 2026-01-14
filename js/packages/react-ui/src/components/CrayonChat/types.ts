import { ReactNode } from "react";
import { ConversationStarterProps } from "../../types/ConversationStarter";

/**
 * Welcome message configuration - either a custom component or props-based config
 */
export type WelcomeMessageConfig =
  | React.ComponentType<any>
  | {
      title?: string;
      description?: string;
      image?: { url: string } | ReactNode;
    };

/**
 * Conversation starters configuration
 */
export interface ConversationStartersConfig {
  variant?: "short" | "long";
  options: ConversationStarterProps[];
}
