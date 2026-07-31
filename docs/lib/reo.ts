import type { ReoClient } from "reodotdev";

const REO_CLIENT_ID = process.env.NEXT_PUBLIC_REO_CLIENT_ID?.trim();

let reoPromise: Promise<ReoClient | undefined> | undefined;

/** Load Reo only in configured browser builds and initialize it once. */
export function loadReo(): Promise<ReoClient | undefined> {
  if (!REO_CLIENT_ID || typeof window === "undefined") {
    return Promise.resolve(undefined);
  }

  reoPromise ??= import("reodotdev")
    .then(({ loadReoScript }) => loadReoScript({ clientID: REO_CLIENT_ID }))
    .then((reo) => {
      reo.init({ clientID: REO_CLIENT_ID });
      return reo;
    });

  return reoPromise;
}
