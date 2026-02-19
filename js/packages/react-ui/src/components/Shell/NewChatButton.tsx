import { useThreadListActions } from "@crayonai/react-core";
import clsx from "clsx";
import { Plus, SquarePen } from "lucide-react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { useShellStore } from "./store";

export const NewChatButton = ({ className }: { className?: string }) => {
  const { switchToNewThread } = useThreadListActions();
  const { isSidebarOpen } = useShellStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
  }));

  if (!isSidebarOpen) {
    return (
      <IconButton
        icon={<SquarePen size="1em" />}
        onClick={switchToNewThread}
        variant="primary"
        size="small"
        className={clsx("crayon-shell-new-chat-button_collapsed", className)}
      />
    );
  }

  return (
    <Button
      className={clsx("crayon-shell-new-chat-button", className)}
      iconRight={<Plus />}
      variant="primary"
      size="small"
      onClick={switchToNewThread}
    >
      New Chat
    </Button>
  );
};
