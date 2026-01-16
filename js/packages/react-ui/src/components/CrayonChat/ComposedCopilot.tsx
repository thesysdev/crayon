import { useThreadListState, useThreadState } from "@crayonai/react-core";
import { ScrollVariant } from "../../hooks/useScrollToBottom";
import {
  Composer,
  Container,
  ConversationStarter,
  Header,
  MessageLoading,
  Messages,
  ScrollArea,
  ThreadContainer,
  WelcomeScreen,
} from "../CopilotShell";
import { ConversationStartersConfig, WelcomeMessageConfig } from "./types";
import { isWelcomeComponent } from "./utils";

interface ComposedCopilotProps {
  logoUrl?: string;
  agentName?: string;
  messageLoadingComponent?: () => React.ReactNode;
  scrollVariant: ScrollVariant;
  isArtifactActive?: boolean;
  renderArtifact?: () => React.ReactNode;
  /** Welcome message shown when thread is empty */
  welcomeMessage?: WelcomeMessageConfig;
  /** Conversation starters shown when thread is empty */
  conversationStarters?: ConversationStartersConfig;
}

/**
 * Internal component to render welcome message based on thread state
 */
const WelcomeMessageRenderer = ({ welcomeMessage }: { welcomeMessage?: WelcomeMessageConfig }) => {
  const { selectedThreadId } = useThreadListState();
  const { messages, isLoadingMessages } = useThreadState();

  if (!welcomeMessage || selectedThreadId || isLoadingMessages || messages.length > 0) {
    return null;
  }

  if (isWelcomeComponent(welcomeMessage)) {
    const CustomWelcome = welcomeMessage;
    // Wrap custom component with WelcomeScreen for proper container styling
    return (
      <WelcomeScreen>
        <CustomWelcome />
      </WelcomeScreen>
    );
  }

  return (
    <WelcomeScreen
      title={welcomeMessage.title}
      description={welcomeMessage.description}
      image={welcomeMessage.image}
    />
  );
};

const ConversationStartersRenderer = ({
  conversationStarters,
}: {
  conversationStarters?: ConversationStartersConfig;
}) => {
  const { selectedThreadId } = useThreadListState();
  const { messages, isLoadingMessages } = useThreadState();

  if (!conversationStarters || selectedThreadId || isLoadingMessages || messages.length > 0) {
    return null;
  }

  return (
    <ConversationStarter
      variant={conversationStarters.variant}
      starters={conversationStarters.options}
    />
  );
};
export const ComposedCopilot = ({
  logoUrl = "https://crayonai.org/img/logo.png",
  agentName = "My Agent",
  messageLoadingComponent: MessageLoadingComponent = MessageLoading,
  scrollVariant,
  isArtifactActive,
  renderArtifact,
  welcomeMessage,
  conversationStarters,
}: ComposedCopilotProps) => {
  return (
    <Container logoUrl={logoUrl} agentName={agentName}>
      <ThreadContainer isArtifactActive={isArtifactActive} renderArtifact={renderArtifact}>
        <Header />
        <WelcomeMessageRenderer welcomeMessage={welcomeMessage} />
        <ScrollArea scrollVariant={scrollVariant}>
          <Messages loader={<MessageLoadingComponent />} />
        </ScrollArea>
        <ConversationStartersRenderer conversationStarters={conversationStarters} />
        <Composer />
      </ThreadContainer>
    </Container>
  );
};
