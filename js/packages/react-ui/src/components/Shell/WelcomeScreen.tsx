import { useThreadState } from "@crayonai/react-core";
import clsx from "clsx";
import { ReactNode } from "react";
import { ConversationStarterProps } from "../../types/ConversationStarter";
import { DesktopWelcomeComposer } from "./components";
import { ConversationStarter, ConversationStarterVariant } from "./ConversationStarter";

interface WelcomeScreenBaseProps {
  /**
   * Additional CSS class name
   */
  className?: string;
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
  const { className, starters = [], starterVariant = "long" } = props;

  const { messages } = useThreadState();

  // Only show when there are no messages
  if (messages.length > 0) {
    return null;
  }

  // Check if children are provided
  if ("children" in props && props.children) {
    return <div className={clsx("crayon-shell-welcome-screen", className)}>{props.children}</div>;
  }

  // Props-based content
  const { title, description, image } = props as WelcomeScreenWithContentProps;

  const renderImage = () => {
    if (!image) return null;

    if (isImageUrl(image)) {
      return (
        <img src={image.url} alt={title || ""} className="crayon-shell-welcome-screen__image" />
      );
    }

    return image;
  };

  return (
    <div
      className={clsx(
        "crayon-shell-welcome-screen",
        "crayon-shell-welcome-screen--with-composer",
        className,
      )}
    >
      <div className="crayon-shell-welcome-screen__header">
        {image && (
          <div className="crayon-shell-welcome-screen__image-container">{renderImage()}</div>
        )}
        {(title || description) && (
          <div className="crayon-shell-welcome-screen__content">
            {title && <h2 className="crayon-shell-welcome-screen__title">{title}</h2>}
            {description && (
              <p className="crayon-shell-welcome-screen__description">{description}</p>
            )}
          </div>
        )}
      </div>
      {/* Desktop-only welcome composer */}
      <div className="crayon-shell-welcome-screen__composer-starters-container">
        <div className="crayon-shell-welcome-screen__desktop-composer">
          <DesktopWelcomeComposer />
        </div>
        {/* Desktop-only conversation starters */}
        {starters.length > 0 && (
          <div className="crayon-shell-welcome-screen__desktop-starters">
            <ConversationStarter starters={starters} variant={starterVariant} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;
