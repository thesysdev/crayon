import { createContext, useContext } from "react";
import { useShallow } from "zustand/shallow";
import { Message } from "../types";

export const MessageContext = createContext<{ message: Message } | null>(null);

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessage must be used within a MessageProvider");
  }
  return context;
};

export const MessageProvider = ({
  message,
  children,
}: {
  message: Message;
  children: React.ReactNode;
}) => {
  const ctxValue = useShallow((s: void) => ({ message }))();

  return <MessageContext.Provider value={ctxValue}>{children}</MessageContext.Provider>;
};
