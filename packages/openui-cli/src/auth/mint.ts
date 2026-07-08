import { telemetry } from "../lib/telemetry";
import { Authenticator } from "./authenticator";

// Thesys console OAuth + key mint (same flow as create-c1-app). The OpenUI Cloud
// master key is the same C1-flavored org API key (usageType "C1").
const THESYS_API_URL = "https://api.app.thesys.dev";
const THESYS_ISSUER_URL = "https://api.app.thesys.dev/oidc";
const THESYS_CLIENT_ID = "create-c1-app"; // public PKCE client (no secret)
export const THESYS_KEYS_URL = "https://console.thesys.dev/keys";

export type CloudAuthMethod = "oauth" | "manual" | "skip";
/** How the cloud key was obtained (for telemetry) — auth method + the `--api-key` flag case. */
export type ResolvedAuthMethod = CloudAuthMethod | "apikey-flag";

/** Sign in via the browser and mint an OpenUI Cloud API key for the user's org. */
export async function mintCloudApiKey(projectName: string): Promise<string> {
  const auth = new Authenticator({ issuerUrl: THESYS_ISSUER_URL, clientId: THESYS_CLIENT_ID });
  telemetry.capture("cli_cloud_oidc_started");
  await auth.initialize();
  const { accessToken, userInfo } = await auth.authenticate();

  const { fetchUserInfo } = await import("openid-client");
  const profile = await fetchUserInfo(
    auth.getClientConfig(),
    accessToken,
    (userInfo?.["sub"] as string | undefined) ?? "",
  );
  const orgId = (profile["org_claims"] as { orgId: string }[] | undefined)?.[0]?.orgId;
  if (!orgId) {
    throw new Error(`No organization found for your account. Create a key at ${THESYS_KEYS_URL}.`);
  }

  console.info("🔑 Creating an OpenUI Cloud API key…");
  const res = await fetch(`${THESYS_API_URL}/application/application.createApiKeyWithOidc`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ name: projectName || "OpenUI Cloud App", orgId, usageType: "C1" }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create API key (HTTP ${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { apiKey?: string };
  if (!data.apiKey) throw new Error("The server did not return an API key.");

  const oidcSub =
    (profile["sub"] as string | undefined) ?? (userInfo?.["sub"] as string | undefined);
  if (oidcSub) telemetry.aliasOidcSubject(oidcSub);

  return data.apiKey;
}

/**
 * Resolve a cloud API key by the chosen method: an explicitly provided key, a
 * browser OAuth mint, a manual paste, or skip (null → leave the .env slot empty).
 */
export async function resolveCloudApiKey(opts: {
  apiKey?: string;
  auth?: CloudAuthMethod;
  projectName: string;
  interactive: boolean;
}): Promise<{ key: string | null; method: ResolvedAuthMethod }> {
  const provided = opts.apiKey?.trim();
  if (provided) return { key: provided, method: "apikey-flag" };

  let method = opts.auth;
  if (!method) {
    if (!opts.interactive) {
      throw new Error(
        `An API key is required in non-interactive mode. Pass --api-key <key> ` +
          `(get one at ${THESYS_KEYS_URL}).`,
      );
    }
    const { select } = await import("@inquirer/prompts");
    method = (await select({
      message: "Connect to OpenUI Cloud:",
      choices: [
        { name: "Sign in with Thesys (opens a browser, mints a key)", value: "oauth" },
        { name: "Paste an existing API key", value: "manual" },
        { name: "Skip — add THESYS_API_KEY to .env later", value: "skip" },
      ],
    })) as CloudAuthMethod;
  }

  if (method === "skip") return { key: null, method: "skip" };

  if (method === "manual") {
    const { password } = await import("@inquirer/prompts");
    const key = (
      await password({ message: "Paste your OpenUI Cloud API key:", mask: true })
    ).trim();
    return { key: key || null, method: "manual" };
  }

  return { key: await mintCloudApiKey(opts.projectName), method: "oauth" };
}
