import { useThreadListState, useThreadState } from "@crayonai/react-core";
import { ScrollVariant } from "../../hooks/useScrollToBottom";
import {
  Composer,
  Container,
  ConversationStarter,
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
  WelcomeScreen,
} from "../Shell";
import { ConversationStartersConfig, WelcomeMessageConfig } from "./types";
import { isWelcomeComponent } from "./utils";

interface ComposedStandaloneProps {
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
 * For Shell, WelcomeScreen includes built-in starters on desktop
 */
const WelcomeMessageRenderer = ({
  welcomeMessage,
  conversationStarters,
}: {
  welcomeMessage?: WelcomeMessageConfig;
  conversationStarters?: ConversationStartersConfig;
}) => {
  const { selectedThreadId } = useThreadListState();
  const { messages, isLoadingMessages } = useThreadState();

  if (!welcomeMessage || selectedThreadId !== null || isLoadingMessages || messages.length > 0) {
    return null;
  }

  if (isWelcomeComponent(welcomeMessage)) {
    const CustomWelcome = welcomeMessage;
    // Wrap custom component with WelcomeScreen for proper container styling
    // Note: starters are rendered separately via ConversationStarter component
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
      starters={conversationStarters?.options}
      starterVariant={conversationStarters?.variant}
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

  if (
    !conversationStarters ||
    selectedThreadId !== null ||
    isLoadingMessages ||
    messages.length > 0
  ) {
    return null;
  }

  return (
    <ConversationStarter
      variant={conversationStarters.variant}
      starters={conversationStarters.options}
    />
  );
};

export const ComposedStandalone = ({
  logoUrl = "https://crayonai.org/img/logo.png",
  agentName = "My Agent",
  messageLoadingComponent: MessageLoadingComponent = MessageLoading,
  scrollVariant,
  isArtifactActive,
  renderArtifact,
  welcomeMessage,
  conversationStarters,
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
        <WelcomeMessageRenderer
          welcomeMessage={welcomeMessage}
          conversationStarters={conversationStarters}
        />
        <ScrollArea scrollVariant={scrollVariant}>
          <Messages loader={<MessageLoadingComponent />} />
        </ScrollArea>
        <ConversationStartersRenderer conversationStarters={conversationStarters} />
        <Composer />
      </ThreadContainer>
    </Container>
  );
};
