import { ScrollVariant } from "../../hooks/useScrollToBottom";
import {
  Composer,
  Container,
  Header,
  MessageLoading,
  Messages,
  ScrollArea,
  ThreadContainer,
} from "../CopilotShell";
interface ComposedCopilotProps {
  logoUrl?: string;
  agentName?: string;
  messageLoadingComponent?: () => React.ReactNode;
  scrollVariant: ScrollVariant;
  isArtifactActive?: boolean;
  renderArtifact?: () => React.ReactNode;
}

export const ComposedCopilot = ({
  logoUrl = "https://crayonai.org/img/logo.png",
  agentName = "My Agent",
  messageLoadingComponent: MessageLoadingComponent = MessageLoading,
  scrollVariant,
  isArtifactActive,
  renderArtifact,
}: ComposedCopilotProps) => {
  return (
    <Container logoUrl={logoUrl} agentName={agentName}>
      <ThreadContainer isArtifactActive={isArtifactActive} renderArtifact={renderArtifact}>
        <Header />

        <ScrollArea scrollVariant={scrollVariant}>
          <Messages loader={<MessageLoadingComponent />} />
        </ScrollArea>
        <Composer />
      </ThreadContainer>
    </Container>
  );
};
