"use client";

import { ClipboardCommandButton } from "@/app/(home)/components/Button/Button";
import { captureCreateCliCommandCopied } from "@/lib/analytics";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import styles from "./build-for-free-menu.module.css";
import { useHeaderDropdown } from "./use-header-dropdown";

export const CLI_COMMANDS = [
  { id: "pnpm", runner: "pnpx", command: "pnpx @openuidev/cli@latest create" },
  { id: "bun", runner: "bunx", command: "bunx @openuidev/cli@latest create" },
  { id: "yarn", runner: "yarn dlx", command: "yarn dlx @openuidev/cli@latest create" },
  { id: "npm", runner: "npx", command: "npx @openuidev/cli@latest create" },
] as const;

interface BuildForFreeMenuProps {
  analyticsSource: "chat_navbar" | "compare_navbar";
  className?: string;
  dataAttributeElement?: string;
  onOpen?: () => void;
}

export function BuildForFreeMenu({
  analyticsSource,
  className,
  dataAttributeElement,
  onOpen,
}: BuildForFreeMenuProps) {
  const { open, setOpen, wrapRef, triggerRef, handleHoverOpen, handleHoverClose } =
    useHeaderDropdown();
  const onOpenRef = useRef(onOpen);
  const wasOpenRef = useRef(open);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    if (open && !wasOpenRef.current) onOpenRef.current?.();
    wasOpenRef.current = open;
  }, [open]);

  return (
    <div
      className={`${styles.root} ${className ?? ""}`.trim()}
      ref={wrapRef}
      onPointerEnter={handleHoverOpen}
      onPointerLeave={handleHoverClose}
    >
      <button
        type="button"
        ref={triggerRef}
        className={styles.button}
        aria-haspopup="menu"
        aria-expanded={open}
        data-attribute-element={dataAttributeElement}
        onClick={() => setOpen(!open)}
      >
        <span>Build for free</span>
        <ArrowRight
          size={15}
          strokeWidth={2}
          aria-hidden="true"
          className={styles.arrow}
          data-open={open}
        />
      </button>

      <div className={`${styles.menu} ${open ? styles.menuOpen : ""}`.trim()}>
        <div
          className={styles.menuCard}
          role="menu"
          aria-label="Copy the setup command for a package manager"
        >
          {CLI_COMMANDS.map((item) => (
            <ClipboardCommandButton
              key={item.id}
              command={item.command}
              className={styles.menuItem}
              iconContainerClassName={styles.menuItemIcon}
              copyIconColor="currentColor"
              onCopySuccess={(command) =>
                captureCreateCliCommandCopied(command, {
                  source: analyticsSource,
                  interaction: "dropdown",
                })
              }
            >
              <span className={styles.menuItemLabel}>
                <span className={styles.menuItemRunner}>{item.runner}</span>
                {item.command.slice(item.runner.length)}
              </span>
            </ClipboardCommandButton>
          ))}
        </div>
      </div>
    </div>
  );
}
