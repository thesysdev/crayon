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
          <ScrollArea scrollVariant={scrollVariant}>
            <Messages loader={<MessageLoadingComponent />} />
          </ScrollArea>
          <Composer />
        </ThreadContainer>
      </Container>
    </>
  );
};
