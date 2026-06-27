import clsx from "clsx";
import React from "react";
import { useShellStore } from "../_shared/store";

/**
 * Wraps a GenUI assistant message with the assistant logo + content layout.
 *
 * Extracted from the (now-deleted) Shell so the kept `GenUIAssistantMessage`
 * keeps rendering under `AgentInterface`. `logoUrl`/`showAssistantLogo` come
 * from the library-wide shell store, which `AgentInterface`'s `Container`
 * provides via `ShellStoreProvider`.
 */
export const AssistantMessageContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const { logoUrl, showAssistantLogo } = useShellStore((store) => ({
    logoUrl: store.logoUrl,
    showAssistantLogo: store.showAssistantLogo,
  }));

  return (
    <div
      className={clsx("openui-shell-thread-message-assistant", className, {
        "openui-shell-thread-message-assistant--without-logo": !showAssistantLogo,
      })}
    >
      {showAssistantLogo && (
        <img
          src={logoUrl}
          alt="Assistant"
          className="openui-shell-thread-message-assistant__logo"
        />
      )}
      <div className="openui-shell-thread-message-assistant__content">{children}</div>
    </div>
  );
};
