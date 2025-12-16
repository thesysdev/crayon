import {
  ChatProvider,
  Message,
  useThreadListManager,
  useThreadManager,
} from "@crayonai/react-core";
import {
  Composer,
  Container,
  Header,
  MessageLoading,
  Messages,
  ScrollArea,
  ThreadContainer,
} from "../../BottomTray";
// @ts-ignore
import styles from "./style.module.scss";
import logoUrl from "./thesysdev_logo.jpeg";

export default {
  title: "Components/BottomTray",
  tags: ["dev", "!autodocs"],
};

const BottomTrayStory = () => {
  const threadListManager = useThreadListManager({
      createThread: async () => {
        return {
          threadId: crypto.randomUUID(),
          title: "test",
          createdAt: new Date(),
          isRunning: false,
        };
      },
      fetchThreadList: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return [
          {
            threadId: "1",
            title: "test",
            createdAt: new Date(),
            isRunning: false,
          },
          {
            threadId: "2",
            title: "test 2",
            createdAt: new Date(),
            isRunning: false,
          },
          {
            threadId: "3",
            title: "test 3",
            createdAt: new Date(),
            isRunning: false,
          },
        ];
      },
      deleteThread: async () => {},
      updateThread: async (t) => t,
      onSwitchToNew: () => {},
      onSelectThread: () => {},
    });

    const threadManager = useThreadManager({
      threadId: threadListManager.selectedThreadId,
      loadThread: async () => {
        return [
          {
            id: crypto.randomUUID(),
            role: "user",
            type: "prompt",
            message: "Hello",
          },
          {
            id: crypto.randomUUID(),
            role: "assistant",
            type: "response",
            message: [{ type: "text", text: "Hello! How can I help you today?" }],
          },
        ];
      },
      onProcessMessage: async ({ message, threadManager, abortController }) => {
        const newMessage = Object.assign({}, message, {
          id: crypto.randomUUID(),
        }) as Message;
        threadManager.appendMessages(newMessage);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return [
          {
            id: crypto.randomUUID(),
            role: "assistant",
            type: "response",
            message: [{ type: "text", text: "This is a response from the bottom tray assistant!" }],
          },
        ];
      },
      responseTemplates: [],
    });

    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <h1>Bottom Tray Example</h1>
          <p>The chat interface appears as a bottom tray in the lower right corner.</p>
        </div>
        <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
          <Container logoUrl={logoUrl} agentName="Crayon Assistant">
            <ThreadContainer>
              <Header />
              <ScrollArea>
                <Messages loader={<MessageLoading />} />
              </ScrollArea>
              <Composer />
            </ThreadContainer>
          </Container>
        </ChatProvider>
      </div>
    );
};

export const Default = {
  render: () => <BottomTrayStory />,
};

