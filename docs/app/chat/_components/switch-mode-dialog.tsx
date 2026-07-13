"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import styles from "../chat-page.module.css";
import type { ChatMode } from "./chat-types";

interface SwitchModeDialogProps {
  currentMode: ChatMode;
  destinationMode: ChatMode | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SwitchModeDialog({
  currentMode,
  destinationMode,
  onCancel,
  onConfirm,
}: SwitchModeDialogProps) {
  return (
    <Dialog.Root
      open={destinationMode !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content
          className={styles.dialogContent}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById(`chat-mode-${currentMode}`)?.focus();
          }}
        >
          <div className={styles.dialogHeading}>
            <Dialog.Title className={styles.dialogTitle}>Switch modes?</Dialog.Title>
            <Dialog.Close className={styles.dialogClose} aria-label="Close">
              <X aria-hidden="true" size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className={styles.dialogDescription}>
            This starts a new chat. Your current conversation will not be carried over.
          </Dialog.Description>
          <div className={styles.dialogActions}>
            <Dialog.Close className={styles.secondaryButton}>Stay here</Dialog.Close>
            <button className={styles.primaryButton} type="button" onClick={onConfirm}>
              Switch modes
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
