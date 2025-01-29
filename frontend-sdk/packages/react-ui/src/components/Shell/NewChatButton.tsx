import { useThreadListActions } from "@crayonai/react-core";
import { Plus } from "lucide-react";
import { Button } from "../Button";

export const NewChatButton = () => {
  const { switchToNewThread } = useThreadListActions();

  return (
    <Button
      className="crayon-shell-new-chat-button"
      iconRight={<Plus />}
      onClick={switchToNewThread}
    >
      New Chat
    </Button>
  );
};
