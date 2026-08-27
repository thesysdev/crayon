"use client";

import * as Observability from "@openuidev/observability-cloud";
import { useEffect } from "react";

let initialized = false;

/**
 * Reports OpenUI render events from the site demos to the Thesys reliability
 * dashboard (console.thesys.dev/reliability). Stays inert until
 * NEXT_PUBLIC_THESYS_CLIENT_API_KEY is set to a client API key from
 * console.thesys.dev/client-api-keys.
 */
export function ReliabilityObservability() {
  useEffect(() => {
    if (initialized) return;

    const apiKey = process.env.NEXT_PUBLIC_THESYS_CLIENT_API_KEY?.trim();
    if (!apiKey) return;

    initialized = true;
    Observability.init({ apiKey });
  }, []);

  return null;
}
