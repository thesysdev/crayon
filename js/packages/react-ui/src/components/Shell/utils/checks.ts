import { isValidElement } from "react";

export type AttachmentConfig = {
  icon: React.ReactNode;
  onClick: () => void;
};

export function isAttachmentConfig(value: unknown): value is AttachmentConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    !isValidElement(value) &&
    "icon" in value &&
    "onClick" in value
  );
}
