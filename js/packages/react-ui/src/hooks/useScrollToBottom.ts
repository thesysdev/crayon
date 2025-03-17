import { RefObject, useEffect, useRef } from "react";

export const useScrollToBottom = <T extends HTMLElement | null, L extends { id: string }>({
  ref,
  lastMessage,
  scrollVariant,
  userMessageSelector = ".crayon-shell-thread-message-user",
  isRunning,
}: {
  ref: RefObject<T>;
  // scroll to bottom when this value changes
  lastMessage: L;
  scrollVariant: "always" | "once" | "user-message-anchor";
  userMessageSelector?: string;
  isRunning?: boolean;
}) => {
  const previousLastMessage = useRef<L | null>(null);
  const lastUserMessage = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    if (scrollVariant === "always") {
      if (previousLastMessage.current !== lastMessage) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: "smooth",
        });
      }
    } else if (scrollVariant === "once") {
      if (previousLastMessage.current?.id !== lastMessage.id) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: "smooth",
        });
      }
    } else {
      const lastUserMessageDiv = Array.from(element.querySelectorAll(userMessageSelector)).pop() as
        | HTMLElement
        | undefined;
      const lastUserMessageNextSibling = lastUserMessageDiv?.nextElementSibling;

      if (
        lastUserMessageDiv &&
        !lastUserMessageNextSibling?.nextElementSibling &&
        previousLastMessage.current?.id !== lastMessage.id
      ) {
        // scroll to last user message till there is only 1 more message
        const scrollPosition =
          lastUserMessageDiv.getBoundingClientRect().top -
          element.getBoundingClientRect().top +
          element.scrollTop;

        element.scrollTo({ top: scrollPosition, behavior: "smooth" });
        lastUserMessage.current = lastUserMessageDiv;
      }
    }

    previousLastMessage.current = lastMessage;
  }, [ref, lastMessage, scrollVariant, userMessageSelector]);

  useEffect(() => {
    if (isRunning) {
      ref.current?.scrollTo({
        top: ref.current?.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [isRunning]);
};
