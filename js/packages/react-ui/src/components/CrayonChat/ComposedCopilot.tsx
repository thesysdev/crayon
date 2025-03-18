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
}

export const ComposedCopilot = ({
  logoUrl = "https://crayonai.org/img/logo.png",
  agentName = "My Agent",
}: ComposedCopilotProps) => {
  return (
    <Container logoUrl={logoUrl} agentName={agentName}>
      <ThreadContainer>
        <Header />
        <ScrollArea>
          <Messages loader={<MessageLoading />} />
        </ScrollArea>
        <Composer />
      </ThreadContainer>
    </Container>
  );
};
