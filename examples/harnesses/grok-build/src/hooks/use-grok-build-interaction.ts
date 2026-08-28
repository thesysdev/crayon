"use client";

import type {
  GrokBuildInteraction,
  GrokBuildInteractionResponse,
} from "@/lib/grok-build-interactions";
import { useCallback, useEffect, useState } from "react";

const POLL_RETRY_MS = 1_000;

interface InteractionPayload {
  interaction?: GrokBuildInteraction | null;
}

export function useGrokBuildInteraction(threadId: string | undefined) {
  const [interaction, setInteraction] = useState<GrokBuildInteraction>();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!threadId) return;

    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let observedInteractionId: string | undefined;

    const poll = async () => {
      controller = new AbortController();
      let retryDelay = 0;
      try {
        const query = new URLSearchParams({ threadId });
        if (observedInteractionId) query.set("after", observedInteractionId);
        const response = await fetch(`/api/interactions?${query}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Interaction poll failed (${response.status}).`);
        const payload = (await response.json()) as InteractionPayload;
        if (!disposed) {
          const nextInteraction = payload.interaction ?? undefined;
          observedInteractionId = nextInteraction?.id;
          setInteraction(nextInteraction);
          setError(undefined);
        }
      } catch (pollError) {
        if (!disposed && !(pollError instanceof DOMException && pollError.name === "AbortError")) {
          setError(pollError instanceof Error ? pollError.message : "Could not load interaction.");
          retryDelay = POLL_RETRY_MS;
        }
      } finally {
        if (!disposed) timer = setTimeout(poll, retryDelay);
      }
    };

    void poll();
    return () => {
      disposed = true;
      controller?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [threadId]);

  const respond = useCallback(
    async (responseValue: GrokBuildInteractionResponse) => {
      if (!threadId || !interaction) return;
      setSubmitting(true);
      setError(undefined);
      try {
        const response = await fetch("/api/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId,
            interactionId: interaction.id,
            response: responseValue,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? `Interaction response failed (${response.status}).`);
        }
        setInteraction(undefined);
      } catch (responseError) {
        setError(
          responseError instanceof Error ? responseError.message : "Could not submit response.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [interaction, threadId],
  );

  return {
    error: threadId ? error : undefined,
    interaction: threadId && interaction?.sessionId === threadId ? interaction : undefined,
    respond,
    submitting,
  };
}
