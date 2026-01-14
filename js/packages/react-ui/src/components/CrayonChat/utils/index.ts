import { WelcomeMessageConfig } from "../types";

/**
 * Helper to check if welcomeMessage is a custom component
 */
export const isWelcomeComponent = (
  config: WelcomeMessageConfig,
): config is React.ComponentType<any> => {
  return typeof config === "function";
};
