import { useThreadState } from "@crayonai/react-core";
import { useState } from "react";
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
  Trigger,
  WelcomeScreen,
} from "../BottomTray";
import { ConversationStartersConfig, WelcomeMessageConfig } from "./types";
import { isChatEmpty, isWelcomeComponent } from "./utils";

interface ComposedBottomTrayProps {
  logoUrl?: string;
  agentName?: string;
  messageLoadingComponent?: () => React.ReactNode;
  scrollVariant: ScrollVariant;
  isArtifactActive?: boolean;
  renderArtifact?: () => React.ReactNode;
  /** Control the open state of the tray */
  isOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean;
  /** Welcome message shown when thread is empty */
  welcomeMessage?: WelcomeMessageConfig;
  /** Conversation starters shown when thread is empty */
  conversationStarters?: ConversationStartersConfig;
}

/**
 * Internal component to render welcome message based on thread state
 */
const WelcomeMessageRenderer = ({ welcomeMessage }: { welcomeMessage?: WelcomeMessageConfig }) => {
  const { messages, isLoadingMessages } = useThreadState();

  if (!welcomeMessage || isChatEmpty({ isLoadingMessages, messages })) {
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
  const { messages, isLoadingMessages } = useThreadState();

  if (!conversationStarters || isChatEmpty({ isLoadingMessages, messages })) {
    return null;
  }

  return (
    <ConversationStarter
      variant={conversationStarters.variant}
      starters={conversationStarters.options}
    />
  );
};
export const ComposedBottomTray = ({
  logoUrl = "https://crayonai.org/img/logo.png",
  agentName = "My Agent",
  messageLoadingComponent: MessageLoadingComponent = MessageLoading,
  scrollVariant,
  isArtifactActive,
  renderArtifact,
  isOpen: controlledIsOpen,
  onOpenChange,
  defaultOpen = false,
  welcomeMessage,
  conversationStarters,
}: ComposedBottomTrayProps) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;

  const handleOpenChange = (newIsOpen: boolean) => {
    if (controlledIsOpen === undefined) {
      setUncontrolledIsOpen(newIsOpen);
    }
    onOpenChange?.(newIsOpen);
  };

  return (
    <>
      {/* Trigger is always visible - toggles the tray (hidden on mobile when open) */}
      <Trigger onClick={() => handleOpenChange(!isOpen)} isOpen={isOpen}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="crayon-bottom-tray-trigger-logo" />
        ) : null}
      </Trigger>

      {/* Controlled container */}
      <Container logoUrl={logoUrl} agentName={agentName} isOpen={isOpen}>
        <ThreadContainer isArtifactActive={isArtifactActive} renderArtifact={renderArtifact}>
          <Header onMinimize={() => handleOpenChange(false)} />
          <WelcomeMessageRenderer welcomeMessage={welcomeMessage} />
          <ScrollArea scrollVariant={scrollVariant}>
            <Messages loader={<MessageLoadingComponent />} />
          </ScrollArea>
          <ConversationStartersRenderer conversationStarters={conversationStarters} />
          <Composer />
        </ThreadContainer>
      </Container>
    </>
  );
};
