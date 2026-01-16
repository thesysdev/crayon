import { ReactNode } from "react";
import { ConversationStarterProps } from "../../types/ConversationStarter";

/**
 * Welcome message configuration for CrayonChat.
 *
 * Can be either:
 * - A custom React component that will be wrapped with WelcomeScreen for styling
 * - An object with title, description, and optional image
 *
 * @example
 * // Props-based configuration
 * const welcomeMessage: WelcomeMessageConfig = {
 *   title: "Hi, I'm AI Assistant",
 *   description: "I can help you with your questions.",
 *   image: { url: "/logo.png" }, // or a ReactNode for custom styling
 * };
 *
 * @example
 * // Custom component
 * const MyCustomWelcome = () => <div>Custom welcome content</div>;
 * const welcomeMessage: WelcomeMessageConfig = MyCustomWelcome;
 */
export type WelcomeMessageConfig =
  | React.ComponentType<any>
  | {
      /** Title text displayed in the welcome screen */
      title?: string;
      /** Description text displayed below the title */
      description?: string;
      /**
       * Image to display in the welcome screen.
       * - `{ url: string }` - Renders with default 64x64 size, rounded corners
       * - `ReactNode` - Full control over styling (e.g., `<img />`, `<Sparkles />`)
       */
      image?: { url: string } | ReactNode;
    };

/**
 * Configuration for conversation starters in CrayonChat.
 *
 * Conversation starters are clickable prompts shown when the thread is empty,
 * helping users begin a conversation with predefined options.
 *
 * @example
 * const starters: ConversationStartersConfig = {
 *   variant: "short", // "short" for pill buttons, "long" for list items
 *   options: [
 *     { displayText: "Help me get started", prompt: "Help me get started" },
 *     { displayText: "What can you do?", prompt: "What can you do?", icon: <Sparkles /> },
 *   ],
 * };
 */
export interface ConversationStartersConfig {
  /**
   * Visual variant for the conversation starters.
   * - `"short"` - Pill-style buttons that wrap horizontally (default)
   * - `"long"` - Vertical list with separators and hover arrows
   */
  variant?: "short" | "long";
  /**
   * Array of conversation starter options.
   * Each option has displayText, prompt, and optional icon.
   */
  options: ConversationStarterProps[];
}
