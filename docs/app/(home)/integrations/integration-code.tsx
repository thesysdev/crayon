import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import type { IntegrationCode as IntegrationCodeData } from "./data";
import styles from "./page.module.css";

/** Highlighted on the server with the docs' own themes, so the code is in the HTML. */
export function IntegrationCode({ code }: { code: IntegrationCodeData }) {
  return (
    <ServerCodeBlock
      code={code.code.trim()}
      lang={code.lang}
      themes={{ light: "github-light", dark: "github-dark" }}
      codeblock={{ title: code.filename, className: styles.stepCode }}
    />
  );
}
