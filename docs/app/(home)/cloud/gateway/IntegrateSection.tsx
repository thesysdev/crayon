import { CloudIntegrationSetup, type CloudIntegrationStep } from "../CloudIntegrationSection";
import styles from "./sections.module.css";

const API_KEY_EXAMPLE = `const client = new OpenAI({
  apiKey: process.env.THESYS_API_KEY,
  baseURL: "https://api.thesys.dev/v1/embed",
});`;

const CLIENT_EXAMPLE = `const client = new OpenAI({
  apiKey: process.env.THESYS_API_KEY,
  baseURL: "https://api.thesys.dev/v1/embed",
});

const response = await client.chat.completions.create({
  model: "openai/gpt-5",
  messages,
});`;

const PROMPT_EXAMPLE = `const systemPrompt = generatePrompt({ thesys: true });

const response = await client.chat.completions.create({
  model: "openai/gpt-5",
  messages: [
    { role: "system", content: systemPrompt },
    ...messages,
  ],
});`;

const STEPS: CloudIntegrationStep[] = [
  {
    title: "Generate an API key",
    description: "Create a Gateway key in the OpenUI console.",
    href: "https://console.thesys.dev/keys",
    code: API_KEY_EXAMPLE,
    highlightLines: [1],
  },
  {
    title: "Update your base URL and model",
    description:
      "Use the Gateway endpoint as your base URL and choose any model string from models.dev.",
    code: CLIENT_EXAMPLE,
    highlightLines: [2, 6],
  },
  {
    title: "Enable Gateway in your prompt",
    description: "Include your component schema so Gateway can validate each response.",
    code: PROMPT_EXAMPLE,
    highlightLines: [0],
  },
];

const GATEWAY_EXAMPLE = `const client = new OpenAI({
  apiKey: process.env.THESYS_API_KEY,
  baseURL: "https://api.thesys.dev/v1/embed",
});

const response = await client.chat.completions.create({
  model: "openai/gpt-5",
  messages,
});

const systemPrompt = generatePrompt({ thesys: true });`;

export function IntegrateSection() {
  return (
    <section className={styles.adoptionSection} aria-labelledby="gateway-integrate">
      <CloudIntegrationSetup
        title="Adopt it by changing your base URL"
        titleId="gateway-integrate"
        steps={STEPS}
        code={GATEWAY_EXAMPLE}
        codeLabel="OpenUI Gateway client configuration"
        action={{ label: "Read integration guide", href: "/docs/openui-cloud/get-started" }}
        titleSize="medium"
      />
    </section>
  );
}
