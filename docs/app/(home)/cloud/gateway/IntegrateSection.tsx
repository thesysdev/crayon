import { CloudCodeBlock } from "../CloudCodeBlock";
import styles from "./sections.module.css";

/* Each step carries its own sample rather than sharing one block, so the change
   a step describes is the only change visible beside it. `highlight` indices are
   0-based into the trimmed `code` string — re-check them if a sample changes. */
const STEPS = [
  {
    title: "Generate an API key",
    description: "Create a Gateway API key from the OpenUI console.",
    href: "https://console.thesys.dev/keys",
  },
  {
    title: "Update your base URL and model",
    description:
      "Point your OpenAI-compatible client at the Gateway endpoint and use any model string from models.dev.",
    code: `const client = new OpenAI({
  apiKey: process.env.THESYS_API_KEY,
  baseURL: "https://api.thesys.dev/v1/embed",
});

const response = await client.chat.completions.create({
  model: "openai/gpt-5",
  messages,
});`,
    highlight: [2, 6],
  },
  {
    title: "Turn on Gateway in your prompt",
    /* UNVERIFIED. `thesys` is not an option on PromptSpec in
       packages/lang-core (tools, editMode, inlineMode, toolCalls, bindings,
       preamble, examples, toolExamples, additionalRules) nor on
       SystemPromptOptions in the published @openuidev/thesys-server. Written as
       described rather than as found — confirm before this ships. */
    description:
      "Pass thesys: true to generatePrompt so the request carries your component schema.",
    code: `import { generatePrompt } from "@openuidev/lang-core";

const systemPrompt = generatePrompt({ thesys: true });`,
    highlight: [2],
  },
];

export function IntegrateSection() {
  return (
    <section className={styles.section} aria-labelledby="gateway-integrate">
      <h2 id="gateway-integrate" className={styles.heading}>
        Adopt it by changing your base URL
      </h2>
      <p className={styles.lead}>
        Point your existing agent backend at the Gateway. Your SDK calls stay the same.
      </p>

      <ol className={styles.steps}>
        {STEPS.map((step) => (
          <li className={styles.step} key={step.title}>
            <div className={styles.stepHead}>
              <span className={styles.term}>
                {step.href ? (
                  <a
                    className={styles.termLink}
                    href={step.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {step.title}
                  </a>
                ) : (
                  step.title
                )}
              </span>
              <p className={styles.desc}>{step.description}</p>
            </div>
            {step.code ? (
              <div className={styles.stepCode}>
                <CloudCodeBlock code={step.code} highlightLines={step.highlight} />
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {/* The rest of the upgrade is a docs concern, so the page hands off here
          rather than listing it. */}
      <a className={styles.link} href="/docs/openui-cloud/get-started">
        Read the integration guide →
      </a>
    </section>
  );
}
