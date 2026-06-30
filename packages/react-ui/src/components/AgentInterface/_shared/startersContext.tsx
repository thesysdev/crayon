import { createContext, useContext, type ReactNode } from "react";
import type { ConversationStarterProps } from "../../../types/ConversationStarter";
import type { ConversationStarterVariant } from "../ConversationStarter";

export interface StartersContextValue {
  starters?: ConversationStarterProps[];
  starterVariant?: ConversationStarterVariant;
}

const StartersContext = createContext<StartersContextValue>({});

export const StartersProvider = ({
  starters,
  starterVariant,
  children,
}: StartersContextValue & { children: ReactNode }) => (
  <StartersContext.Provider value={{ starters, starterVariant }}>
    {children}
  </StartersContext.Provider>
);

export const useStartersFromContext = () => useContext(StartersContext);
