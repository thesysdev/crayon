import { CloudCodeBlock } from "./CloudCodeBlock";
import styles from "./CloudIntegrationSection.module.css";

const CLIENT_EXAMPLE = `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.THESYS_API_KEY,
  baseURL: "https://api.thesys.dev/v1/embed",
});`;

export function CloudIntegrationSection() {
  return (
    <section className={styles.section} aria-labelledby="cloud-integration-title">
      <div className={styles.content}>
        <h2 id="cloud-integration-title" className={styles.title}>
          Switch to OpenUI Cloud in seconds
        </h2>
        <p className={styles.body}>
          OpenUI Cloud works with your existing OpenUI application and OpenAI-compatible SDK. Get an
          API key and point your client to the Cloud endpoint.
        </p>
      </div>

      <div className={styles.codeColumn} aria-label="OpenUI Cloud client configuration">
        <CloudCodeBlock code={CLIENT_EXAMPLE} />
      </div>
    </section>
  );
}
