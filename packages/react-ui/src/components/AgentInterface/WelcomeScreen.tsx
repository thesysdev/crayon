import { useThread } from "@openuidev/react-headless";
import clsx from "clsx";
import { ReactNode } from "react";
import { ConversationStarterProps } from "../../types/ConversationStarter";
import { useStartersFromContext } from "./_shared/startersContext";
import { isChatEmpty } from "./_shared/utils";
import { DesktopWelcomeComposer } from "./components";
import { ConversationStarter, ConversationStarterVariant } from "./ConversationStarter";
import { WelcomeGlow, WelcomeGlowProvider } from "./WelcomeGlow";

interface WelcomeScreenBaseProps {
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Plays the one-shot welcome entrance and composer glow animation.
   * @default false
   */
  glowAnimation?: boolean;
}

interface WelcomeScreenWithContentProps extends WelcomeScreenBaseProps {
  /**
   * The greeting/title text to display
   */
  title?: string;
  /**
   * Optional description text to add more context
   */
  description?: string;
  /**
   * Image to display - can be a URL object or a ReactNode
   * - { url: string }: Renders an <img> tag with default styling (64x64, object-fit: cover, rounded)
   * - ReactNode: Renders the provided element directly (for custom icons, styled images, etc.)
   */
  image?: { url: string } | ReactNode;
  /**
   * Conversation starters to show below the composer
   */
  starters?: ConversationStarterProps[];
  /**
   * Variant of the conversation starters
   */
  starterVariant?: ConversationStarterVariant;
  /**
   * Children are not allowed when using props-based content
   */
  children?: never;
}

interface WelcomeScreenWithChildrenProps extends WelcomeScreenBaseProps {
  /**
   * Custom content to render inside the welcome screen
   * When children are provided, title, description, and image are ignored
   */
  children: ReactNode;
  title?: never;
  description?: never;
  image?: never;
  starters?: never;
  starterVariant?: never;
}

export type WelcomeScreenProps = WelcomeScreenWithContentProps | WelcomeScreenWithChildrenProps;

/**
 * Type guard to check if image is a URL object
 */
const isImageUrl = (image: { url: string } | ReactNode): image is { url: string } => {
  return typeof image === "object" && image !== null && "url" in image;
};

export const WelcomeScreen = (props: WelcomeScreenProps) => {
  const { className, glowAnimation = false } = props;
  const fromCtx = useStartersFromContext();

  const ownStarters = "starters" in props ? props.starters : undefined;
  const ownVariant = "starterVariant" in props ? props.starterVariant : undefined;
  const starters = ownStarters ?? fromCtx.starters ?? [];
  const starterVariant = ownVariant ?? fromCtx.starterVariant ?? "long";

  const messages = useThread((s) => s.messages);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  // Only show when there are no messages
  if (!isChatEmpty({ isLoadingMessages, messages })) {
    return null;
  }

  // Check if children are provided
  if ("children" in props && props.children) {
    return (
      <WelcomeGlowProvider enabled={glowAnimation}>
        <div
          className={clsx("openui-agent-welcome-screen", className, {
            "openui-agent-welcome-screen--animated": glowAnimation,
          })}
        >
          {props.children}
        </div>
      </WelcomeGlowProvider>
    );
  }

  // Props-based content
  const { title, description, image } = props as WelcomeScreenWithContentProps;

  const renderImage = () => {
    if (!image) return null;

    if (isImageUrl(image)) {
      return (
        <img src={image.url} alt={title || ""} className="openui-agent-welcome-screen__image" />
      );
    }

    return image;
  };

  return (
    <WelcomeGlowProvider enabled={glowAnimation}>
      <div
        className={clsx(
          "openui-agent-welcome-screen",
          "openui-agent-welcome-screen--with-composer",
          className,
          {
            "openui-agent-welcome-screen--animated": glowAnimation,
          },
        )}
      >
        <div className="openui-agent-welcome-screen__header">
          {image && (
            <div className="openui-agent-welcome-screen__image-container">{renderImage()}</div>
          )}
          {(title || description) && (
            <div className="openui-agent-welcome-screen__content">
              {title && <h2 className="openui-agent-welcome-screen__title">{title}</h2>}
              {description && (
                <p className="openui-agent-welcome-screen__description">{description}</p>
              )}
            </div>
          )}
        </div>
        {/* Desktop-only welcome composer */}
        <div className="openui-agent-welcome-screen__composer-starters-container">
          <div className="openui-agent-welcome-screen__desktop-composer">
            <WelcomeGlow>
              <DesktopWelcomeComposer />
            </WelcomeGlow>
          </div>
          {/* Desktop-only conversation starters */}
          {starters.length > 0 && (
            <div className="openui-agent-welcome-screen__desktop-starters">
              <ConversationStarter starters={starters} variant={starterVariant} />
            </div>
          )}
        </div>
      </div>
    </WelcomeGlowProvider>
  );
};

export default WelcomeScreen;
