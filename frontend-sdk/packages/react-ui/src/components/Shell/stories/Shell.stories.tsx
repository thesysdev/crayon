import {
  ChatProvider,
  Message,
  useThreadListManager,
  useThreadManager,
} from "@crayonai/react-core";
import "../../IconButton/iconButton.scss";
import { Container } from "../Container";
import { MobileHeader } from "../MobileHeader";
import { NewChatButton } from "../NewChatButton";
import "../shell.scss";
import { SidebarContainer, SidebarContent, SidebarHeader, SidebarSeparator } from "../Sidebar";
import { Composer, Messages, ScrollArea, ThreadContainer } from "../Thread";
import { ThreadList } from "../ThreadList";
import logoUrl from "./thesysdev_logo.jpeg";

export default {
  title: "Shell",
};

export const Default = {
  render: () => {
    const threadListManager = useThreadListManager({
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
            message: "Hello",
          },
        ];
      },
      onProcessMessage: async ({ message, threadManager, abortController }) => {
        const newMessage = Object.assign({}, message, {
          id: crypto.randomUUID(),
        }) as Message;

        return [
          newMessage,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            type: "response",
            message: "sadfasdf",
          },
        ];
      },
      responseTemplates: [],
    });

    return (
      <ChatProvider threadListManager={threadListManager} threadManager={threadManager}>
        <Container logoUrl={logoUrl} agentName="Crayon">
          <SidebarContainer>
            <SidebarHeader />
            <SidebarContent>
              <NewChatButton />
              <SidebarSeparator />
              <ThreadList />
            </SidebarContent>
          </SidebarContainer>
          <ThreadContainer>
            <MobileHeader />
            <ScrollArea>
              <Messages />
            </ScrollArea>
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    );
  },
};
