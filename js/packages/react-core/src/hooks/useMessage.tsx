import { createContext, useContext } from "react";
import { useShallow } from "zustand/shallow";
import { Message } from "../types";

/**
 * @category Contexts
 */
export const MessageContext = createContext<{ message: Message } | null>(null);

/**
 * @category Hooks
 * @returns The current message. See {@link Message} for more information.
 */
export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessage must be used within a MessageProvider");
  }
  return context;
};

/**
 * @category Components
 */
export const MessageProvider = ({
  message,
  children,
}: {
  message: Message;
  children: React.ReactNode;
}) => {
  const ctxValue = useShallow((_s: void) => ({ message }))();

  return <MessageContext.Provider value={ctxValue}>{children}</MessageContext.Provider>;
};
