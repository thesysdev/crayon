import { type ObservabilityEvent } from "@openuidev/observability";
import { CreditCard } from "lucide-react";
import type { CSSProperties } from "react";

export interface QuotaErrorInfo {
  title: string;
  message: string;
  showPurchaseCta: boolean;
}

const QUOTA_ERROR_MESSAGES: Record<string, QuotaErrorInfo> = {
  ERR_BILLING_THRESHOLD_EXCEEDED: {
    title: "Add credits to keep going",
    message:
      "Looks like this workspace is out of OpenUI Cloud credits. Purchase credits to keep testing, then try your request again. This notice is only shown in development.",
    showPurchaseCta: true,
  },
  ERR_QUOTA_EXCEEDED: {
    title: "Rate limit reached",
    message:
      "This workspace has hit a rate limit, usually from sending requests too quickly, or exceeding the per-model token/request limit for the current plan. Wait a moment and try again. This notice is only shown in development.",
    showPurchaseCta: false,
  },
};

export function getQuotaError(event: ObservabilityEvent): QuotaErrorInfo | undefined {
  if (event.level !== "error") return undefined;
  const error = asRecord(event.detail)["error"];
  const type = asString(asRecord(error)["type"]);
  return type ? QUOTA_ERROR_MESSAGES[type] : undefined;
}

/** Billing/rate-limit list entry — the highlighted card a known 429 code renders as. */
export function QuotaErrorRow({ info }: { info: QuotaErrorInfo }) {
  return (
    <div style={{ ...styles.row, ...styles.rowCredits }}>
      <div style={styles.creditsNote}>
        <div style={styles.creditsTitle}>{info.title}</div>
        <p style={styles.creditsMessage}>{info.message}</p>
        {info.showPurchaseCta ? (
          <button
            type="button"
            style={styles.action}
            onClick={() =>
              window.open("https://console.thesys.dev/billing", "_blank", "noopener,noreferrer")
            }
          >
            <CreditCard size={13} />
            Purchase Credits
          </button>
        ) : null}
      </div>
    </div>
  );
}

function asRecord(detail: unknown): Record<string, unknown> {
  return typeof detail === "object" && detail !== null ? (detail as Record<string, unknown>) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

const FONT = '"Inter", system-ui, sans-serif';

const styles = {
  row: {
    border: "1px solid #e4e4e7",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(24, 24, 27, 0.04)",
  },
  rowCredits: {
    border: "1px solid #fde68a",
    background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
  },
  creditsNote: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  creditsTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#18181b",
  },
  creditsMessage: {
    margin: 0,
    fontSize: 12,
    lineHeight: 1.55,
    color: "#52525b",
  },
  action: {
    alignSelf: "flex-start",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "none",
    borderRadius: 8,
    background: "#18181b",
    color: "#ffffff",
    padding: "6px 12px",
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    marginTop: 2,
  },
} satisfies Record<string, CSSProperties>;
