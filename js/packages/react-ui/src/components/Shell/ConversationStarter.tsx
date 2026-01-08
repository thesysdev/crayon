import { useThreadActions, useThreadState } from "@crayonai/react-core";
import clsx from "clsx";
import { ConversationStarterProps } from "../../types/ConversationStarter";

interface ConversationStarterItemProps extends ConversationStarterProps {
  onClick: (prompt: string) => void;
  disabled?: boolean;
}

const ConversationStarterItem = ({
  displayText,
  prompt,
  onClick,
  disabled = false,
}: ConversationStarterItemProps) => {
  return (
    <button
      type="button"
      className={clsx("crayon-shell-conversation-starter-item", {
        "crayon-shell-conversation-starter-item--disabled": disabled,
      })}
      onClick={() => onClick(prompt)}
      disabled={disabled}
    >
      {displayText}
    </button>
  );
};

export interface ConversationStarterContainerProps {
  starters: ConversationStarterProps[];
  className?: string;
}

export const ConversationStarter = ({ starters, className }: ConversationStarterContainerProps) => {
  const { processMessage } = useThreadActions();
  const { isRunning, messages } = useThreadState();

  const handleClick = (prompt: string) => {
    if (isRunning) return;
    processMessage({
      type: "prompt",
      role: "user",
      message: prompt,
    });
  };

  // Only show when there are no messages
  if (messages.length > 0) {
    return null;
  }

  if (starters.length === 0) {
    return null;
  }

  return (
    <div className={clsx("crayon-shell-conversation-starter", className)}>
      {starters.map((item) => (
        <ConversationStarterItem
          key={item.displayText}
          displayText={item.displayText}
          prompt={item.prompt}
          onClick={handleClick}
          disabled={isRunning}
        />
      ))}
    </div>
  );
};

export default ConversationStarter;
