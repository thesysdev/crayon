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
  MessageLoadingComponent?: () => React.ReactNode;
}

export const ComposedCopilot = ({
  logoUrl = "https://crayonai.org/img/logo.png",
  agentName = "My Agent",
  MessageLoadingComponent = MessageLoading,
}: ComposedCopilotProps) => {
  return (
    <Container logoUrl={logoUrl} agentName={agentName}>
      <ThreadContainer>
        <Header />
        <ScrollArea>
          <Messages loader={<MessageLoadingComponent />} />
        </ScrollArea>
        <Composer />
      </ThreadContainer>
    </Container>
  );
};
