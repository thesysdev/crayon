declare module "reodotdev" {
  export interface ReoConfig {
    clientID: string;
    scriptUrlPattern?: string | string[];
    version?: string;
  }

  export interface ReoIdentity {
    username: string;
    type: "email" | "github" | "linkedin";
    other_identities?: Array<{
      username: string;
      type: "email" | "github" | "linkedin";
    }>;
    firstname?: string;
    lastname?: string;
    company?: string;
  }

  export interface ReoClient {
    init(config: Pick<ReoConfig, "clientID">): void;
    identify(identity: ReoIdentity): void;
  }

  export function loadReoScript(config: ReoConfig): Promise<ReoClient>;
}
