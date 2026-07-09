"use client";

import {
  BILLING_CREDITS_ACTION_LABEL,
  BILLING_CREDITS_ERROR_MESSAGE,
  BILLING_CREDITS_ERROR_TITLE,
  BILLING_URL,
} from "@/lib/billing";
import { Button } from "@openuidev/react-ui";
import { Modal } from "@openuidev/react-ui/Modal";
import { CreditCard } from "lucide-react";

interface BillingCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillingCreditsDialog({ open, onOpenChange }: BillingCreditsDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm" title={BILLING_CREDITS_ERROR_TITLE}>
      <p className="openui-cloud-billing-dialog__description">
        {BILLING_CREDITS_ERROR_MESSAGE}
      </p>
      <div className="openui-cloud-billing-dialog__actions">
        <Button
          iconLeft={<CreditCard />}
          onClick={() => window.open(BILLING_URL, "_blank", "noopener,noreferrer")}
          size="medium"
          type="button"
          variant="primary"
        >
          {BILLING_CREDITS_ACTION_LABEL}
        </Button>
      </div>
    </Modal>
  );
}
