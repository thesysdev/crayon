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
  /**
   * Conversation starters to show below the composer (desktop only)
   */
  starters?: ConversationStarterProps[];
  /**
   * Variant for the conversation starters
   * @default "long"
   */
  starterVariant?: ConversationStarterVariant;
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
   * Logo URL to display as an image
   */
  logoUrl?: string;
  /**
   * Custom icon to display instead of the default image icon
   * If logoUrl is provided, this will be ignored
   */
  icon?: ReactNode;
  /**
   * Children are not allowed when using props-based content
   */
  children?: never;
}

interface WelcomeScreenWithChildrenProps extends WelcomeScreenBaseProps {
  /**
   * Custom content to render inside the welcome screen
   * When children are provided, title, description, logoUrl, and icon are ignored
   */
  children: ReactNode;
  title?: never;
  description?: never;
  logoUrl?: never;
  icon?: never;
}

export type WelcomeScreenProps = WelcomeScreenWithContentProps | WelcomeScreenWithChildrenProps;

export const WelcomeScreen = (props: WelcomeScreenProps) => {
  const { className, starters = [], starterVariant = "long" } = props;

  // Check if children are provided
  if ("children" in props && props.children) {
    return <div className={clsx("crayon-shell-welcome-screen", className)}>{props.children}</div>;
  }

  // Props-based content
  const { title, description, logoUrl, icon } = props as WelcomeScreenWithContentProps;

  const renderIcon = () => {
    if (logoUrl) {
      return <img src={logoUrl} alt={title} className="crayon-shell-welcome-screen__logo-image" />;
    }

    if (icon) {
      return icon;
    }

    return null;
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
        {(logoUrl || icon) && (
          <div className="crayon-shell-welcome-screen__icon-container">{renderIcon()}</div>
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
