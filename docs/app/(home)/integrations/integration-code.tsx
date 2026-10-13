import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { ArrowUpRight } from "lucide-react";
import type { IntegrationCode as IntegrationCodeData } from "./data";
import styles from "./page.module.css";

/** Highlighted on the server with the docs' own themes, so the code is in the HTML. */
export function IntegrationCode({ code }: { code: IntegrationCodeData }) {
  return (
    <div className={styles.stepCode}>
      <ServerCodeBlock
        code={code.code.trim()}
        lang={code.lang}
        themes={{ light: "github-light", dark: "github-dark" }}
        // Show the whole snippet: a scroll box inside the page scroll hides the
        // end of longer files.
        codeblock={{ title: code.filename, viewportProps: { className: "max-h-none" } }}
      />
      {code.source ? (
        <a
          className={styles.stepCodeSource}
          href={code.source}
          rel="noopener noreferrer"
          target="_blank"
        >
          View the full file
          <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}
