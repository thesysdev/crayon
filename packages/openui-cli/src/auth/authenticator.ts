import http from "node:http";

// openid-client's Configuration type is ESM-only; keep it opaque in this CJS build.
type Configuration = any;

export interface AuthConfig {
  issuerUrl: string;
  clientId: string;
  redirectUri?: string;
  scopes?: string[];
}

export interface AuthResult {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  userInfo?: Record<string, unknown>;
}

const SUCCESS_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Signed in</title><style>body{font-family:system-ui,Arial,sans-serif;text-align:center;padding:64px}h1{color:#16a34a}</style></head><body><h1>✓ Signed in</h1><p>You can close this tab and return to your terminal.</p></body></html>`;

const errorHtml = (msg: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sign-in failed</title><style>body{font-family:system-ui,Arial,sans-serif;text-align:center;padding:64px}h1{color:#dc2626}</style></head><body><h1>Sign-in failed</h1><p>${msg}</p><p>Return to your terminal and try again.</p></body></html>`;

/** OAuth 2.0 + PKCE via a local loopback callback. ESM-only deps load via dynamic import(). */
export class Authenticator {
  private readonly config: AuthConfig & { redirectUri: string; scopes: string[] };
  private clientConfig?: Configuration;
  private codeVerifier?: string;

  constructor(config: AuthConfig) {
    this.config = {
      redirectUri: "http://localhost:0/cb", // 0 = any free port
      scopes: ["openid", "profile", "email"],
      ...config,
    };
  }

  getClientConfig(): Configuration {
    if (!this.clientConfig) {
      throw new Error("Client not initialized. Call initialize() first.");
    }
    return this.clientConfig;
  }

  async initialize(): Promise<void> {
    const { discovery } = await import("openid-client");
    this.clientConfig = await discovery(new URL(this.config.issuerUrl), this.config.clientId);
  }

  async authenticate(): Promise<AuthResult> {
    if (!this.clientConfig) {
      throw new Error("Client not initialized. Call initialize() first.");
    }
    const { randomPKCECodeVerifier, calculatePKCECodeChallenge } = await import("openid-client");
    this.codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(this.codeVerifier);
    return this.handleBrowserAuth(codeChallenge);
  }

  private async handleBrowserAuth(codeChallenge: string): Promise<AuthResult> {
    const { authorizationCodeGrant, buildAuthorizationUrl } = await import("openid-client");
    const { default: open } = await import("open");

    return new Promise<AuthResult>((resolve, reject) => {
      let settled = false;
      let actualPort = 0;
      let timerId: null | NodeJS.Timeout = null;
      const finish = (run: () => void) => {
        if (settled) return;
        settled = true;
        if (timerId) clearTimeout(timerId);
        server.close();
        run();
      };

      const server = http.createServer(async (req, res) => {
        if (!req.url?.startsWith("/cb")) {
          res.writeHead(404, { Connection: "close" });
          res.end("Not found");
          return;
        }
        try {
          const callbackUrl = new URL(req.url, `http://localhost:${actualPort}`);
          if (!this.clientConfig || !this.codeVerifier) {
            throw new Error("Client not properly initialized");
          }
          const tokens = await authorizationCodeGrant(this.clientConfig, callbackUrl, {
            pkceCodeVerifier: this.codeVerifier,
          });
          let userInfo: Record<string, unknown> | undefined;
          try {
            const claims = tokens.claims();
            if (claims) userInfo = claims as Record<string, unknown>;
          } catch {
            /* no id_token claims */
          }
          res.writeHead(200, { "Content-Type": "text/html", Connection: "close" });
          res.end(SUCCESS_HTML);
          finish(() =>
            resolve({
              accessToken: tokens.access_token ?? "",
              refreshToken: tokens.refresh_token,
              idToken: tokens.id_token,
              userInfo,
            }),
          );
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          res.writeHead(200, { "Content-Type": "text/html", Connection: "close" });
          res.end(errorHtml(msg));
          finish(() => reject(new Error(`Token exchange failed: ${msg}`)));
        }
      });

      server.on("error", (error) => finish(() => reject(error)));

      server.listen(0, async () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          finish(() => reject(new Error("Failed to bind a local callback port.")));
          return;
        }
        actualPort = address.port;
        const url = buildAuthorizationUrl(this.clientConfig!, {
          redirect_uri: `http://localhost:${actualPort}/cb`,
          scope: this.config.scopes.join(" "),
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
          prompt: "consent",
        }).toString();

        console.info("\n🌐 Opening your browser to sign in to Thesys…");
        console.info(`   If it doesn't open, visit:\n   ${url}\n`);
        try {
          await open(url);
        } catch {
          /* user opens the URL manually */
        }
        console.info("⏳ Waiting for you to finish signing in…");
      });

      timerId = setTimeout(
        () => finish(() => reject(new Error("Sign-in timed out after 5 minutes."))),
        5 * 60 * 1000,
      );
    });
  }
}
