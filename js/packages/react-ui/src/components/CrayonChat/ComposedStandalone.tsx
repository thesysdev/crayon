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
}

export const ComposedStandalone = ({
  logoUrl = "https://crayonai.org/img/logo.png",
  agentName = "My Agent",
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
          <Messages loader={<MessageLoading />} />
        </ScrollArea>
        <Composer />
      </ThreadContainer>
    </Container>
  );
};
