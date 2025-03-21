import {
  Composer,
  Container,
  MessageLoading,
  Messages,
  MobileHeader,
  NewChatButton,
  ScrollArea,
  SidebarContainer,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
  ThreadContainer,
  ThreadList,
} from "../Shell";

interface ComposedStandaloneProps {
  logoUrl?: string;
  agentName?: string;
  MessageLoadingComponent?: () => React.ReactNode;
}

export const ComposedStandalone = ({
  logoUrl = "https://crayonai.org/img/logo.png",
  agentName = "My Agent",
  MessageLoadingComponent = MessageLoading,
}: ComposedStandaloneProps) => {
  return (
    <Container logoUrl={logoUrl} agentName={agentName}>
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
          <Messages loader={<MessageLoadingComponent />} />
        </ScrollArea>
        <Composer />
      </ThreadContainer>
    </Container>
  );
};
