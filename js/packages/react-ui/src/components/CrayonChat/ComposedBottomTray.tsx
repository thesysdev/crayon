import { useState } from "react";
import { ScrollVariant } from "../../hooks/useScrollToBottom";
import {
  Composer,
  Container,
  Header,
  MessageLoading,
  Messages,
  ScrollArea,
  ThreadContainer,
  Trigger,
} from "../BottomTray";

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
}

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
      {/* Show trigger when tray is closed */}
      {!isOpen && (
        <Trigger onClick={() => handleOpenChange(true)}>
          <span style={{ fontSize: "20px" }}>💬</span>
          <span className="crayon-bottom-tray-trigger__text">{agentName}</span>
        </Trigger>
      )}

      {/* Controlled container */}
      <Container logoUrl={logoUrl} agentName={agentName} isOpen={isOpen}>
        <ThreadContainer isArtifactActive={isArtifactActive} renderArtifact={renderArtifact}>
          <Header onMinimize={() => handleOpenChange(false)} />
          <ScrollArea scrollVariant={scrollVariant}>
            <Messages loader={<MessageLoadingComponent />} />
          </ScrollArea>
          <Composer />
        </ThreadContainer>
      </Container>
    </>
  );
};
