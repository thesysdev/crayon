import { ScrollVariant } from "../../hooks/useScrollToBottom";
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
  messageLoadingComponent?: () => React.ReactNode;
  scrollVariant: ScrollVariant;
  isArtifactActive?: boolean;
  renderArtifact?: () => React.ReactNode;
}

export const ComposedStandalone = ({
  logoUrl = "https://crayonai.org/img/logo.png",
  agentName = "My Agent",
  messageLoadingComponent: MessageLoadingComponent = MessageLoading,
  scrollVariant,
  isArtifactActive,
  renderArtifact,
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
      <ThreadContainer isArtifactActive={isArtifactActive} renderArtifact={renderArtifact}>
        <MobileHeader />
        <ScrollArea scrollVariant={scrollVariant}>
          <Messages loader={<MessageLoadingComponent />} />
        </ScrollArea>
        <Composer />
      </ThreadContainer>
    </Container>
  );
};
