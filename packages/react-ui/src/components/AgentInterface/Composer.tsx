import { useThread } from "@openuidev/react-headless";
import clsx from "clsx";
import type { ReactNode } from "react";
import type { ConversationStarterProps } from "../../types/ConversationStarter";
import { useStartersFromContext } from "./_shared/startersContext";
import { isChatEmpty } from "./_shared/utils";
import { Composer as ComposerInput } from "./components/Composer";
import { ConversationStarter, type ConversationStarterVariant } from "./ConversationStarter";

export interface ComposerProps {
  className?: string;
  placeholder?: string;
  /** Starters chips shown above the input when chat is empty. Inherits from <AgentInterface starters>. */
  starters?: ConversationStarterProps[];
  /** Layout variant for starters. Inherits from <AgentInterface starterVariant>. */
  starterVariant?: ConversationStarterVariant;
  /** Mode C — fully replaces the composer area. When provided, auto-starters rendering is disabled. */
  children?: ReactNode;
}

export const Composer = ({
  className,
  placeholder,
  starters: ownStarters,
  starterVariant: ownVariant,
  children,
}: ComposerProps) => {
  const fromCtx = useStartersFromContext();
  const messages = useThread((s) => s.messages);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  if (children != null) {
    return <div className={clsx("openui-agent-composer-slot", className)}>{children}</div>;
  }

  const effectiveStarters = ownStarters ?? fromCtx.starters;
  const effectiveVariant = ownVariant ?? fromCtx.starterVariant ?? "short";
  const showStarters =
    isChatEmpty({ isLoadingMessages, messages }) &&
    effectiveStarters !== undefined &&
    effectiveStarters.length > 0;

  return (
    <div className={clsx("openui-agent-composer-slot", className)}>
      {showStarters && (
        <ConversationStarter starters={effectiveStarters!} variant={effectiveVariant} />
      )}
      <ComposerInput placeholder={placeholder} />
    </div>
  );
};
