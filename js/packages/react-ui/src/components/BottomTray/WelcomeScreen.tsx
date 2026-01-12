import { useThreadState } from "@crayonai/react-core";
import clsx from "clsx";
import { ReactNode } from "react";

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
  const { className } = props;
  const { messages } = useThreadState();

  // Check if children are provided
  if ("children" in props && props.children) {
    return <div className={clsx("crayon-welcome-screen", className)}>{props.children}</div>;
  }

  // Props-based content
  const { title, description, logoUrl, icon } = props as WelcomeScreenWithContentProps;

  const renderIcon = () => {
    if (logoUrl) {
      return <img src={logoUrl} alt={title} className="crayon-welcome-screen__logo-image" />;
    }

    if (icon) {
      return icon;
    }

    return null;
  };

  return (
    <div className={clsx("crayon-welcome-screen", className)}>
      {(logoUrl || icon) && (
        <div className="crayon-welcome-screen__icon-container">{renderIcon()}</div>
      )}
      {(title || description) && (
        <div className="crayon-welcome-screen__content">
          {title && <h2 className="crayon-welcome-screen__title">{title}</h2>}
          {description && <p className="crayon-welcome-screen__description">{description}</p>}
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;
