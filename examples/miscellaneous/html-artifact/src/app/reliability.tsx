"use client";

import * as Observability from "@openuidev/observability-cloud";
import { useEffect } from "react";

/**
 * Ships OpenUI render events to the Thesys console, where they show up on the
 * reliability dashboard (console.thesys.dev/reliability). Generate a client API
 * key at console.thesys.dev/client-api-keys; without one this renders nothing
 * and sends nothing.
 */
export function Reliability() {
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_THESYS_CLIENT_API_KEY;
    if (!apiKey) return;

    Observability.init({ apiKey });
  }, []);

  return null;
}
