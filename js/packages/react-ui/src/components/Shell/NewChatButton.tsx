import { useThreadListActions } from "@crayonai/react-core";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { Button } from "../Button";

export const NewChatButton = ({ className }: { className?: string }) => {
  const { switchToNewThread } = useThreadListActions();

  return (
    <Button
      className={clsx("crayon-shell-new-chat-button", className)}
      iconRight={<Plus />}
      onClick={switchToNewThread}
    >
      New Chat
    </Button>
  );
};
