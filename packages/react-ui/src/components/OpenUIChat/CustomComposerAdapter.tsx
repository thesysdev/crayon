import { useThread } from "@openuidev/react-headless";
import type { ComposerComponent } from "./types";

export const CustomComposerAdapter = ({ composer: Composer }: { composer: ComposerComponent }) => {
  const processMessage = useThread((s) => s.processMessage);
  const cancelMessage = useThread((s) => s.cancelMessage);
  const isRunning = useThread((s) => s.isRunning);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  return (
    <Composer
      onSend={(message: string) => {
        processMessage({ role: "user", content: message });
      }}
      onCancel={cancelMessage}
      isRunning={isRunning}
      isLoadingMessages={isLoadingMessages}
    />
  );
};
