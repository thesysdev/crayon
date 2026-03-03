import { useThreadList } from "@openuidev/react-headless";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { Button } from "../Button";

export const NewChatButton = ({ className }: { className?: string }) => {
  const switchToNewThread = useThreadList((s) => s.switchToNewThread);

  return (
    <Button
      className={clsx("openui-shell-new-chat-button", className)}
      iconRight={<Plus />}
      onClick={switchToNewThread}
    >
      New Chat
    </Button>
  );
};
