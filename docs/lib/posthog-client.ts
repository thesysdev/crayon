type PostHog = (typeof import("posthog-js/dist/module.slim"))["default"];

let posthogPromise: Promise<PostHog> | undefined;

export function loadPostHog(): Promise<PostHog> {
  posthogPromise ??= import("posthog-js/dist/module.slim").then(({ default: posthog }) => {
    posthog.init("phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D", {
      api_host: "https://dgoeivjus9jfp.cloudfront.net",
      capture_pageview: "history_change",
      advanced_disable_flags: true,
      disable_external_dependency_loading: true,
      disable_session_recording: true,
      disable_surveys: true,
    });

    return posthog;
  });

  return posthogPromise;
}

export function capturePostHogEvent(eventName: string, properties: object): void {
  void loadPostHog()
    .then((posthog) => posthog.capture(eventName, properties as Record<string, unknown>))
    .catch(() => {
      // Analytics must never interfere with the user action being measured.
    });
}
