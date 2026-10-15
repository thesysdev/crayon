import { THESYS_KEYS_URL } from "../../../lib/auth/mint";
import { DEFAULT_ENV_FILE } from "../../../lib/env";

export function missingCloudKeyNote(
  projectDir: string,
  dlxCmd: string,
  envFile = DEFAULT_ENV_FILE,
): string {
  const fileArg = envFile === DEFAULT_ENV_FILE ? "" : ` --file ${envFile}`;
  return [
    `[!] No OpenUI Cloud API key added. Sign in and write one to ${envFile} with:`,
    `> cd ${projectDir}`,
    `> ${dlxCmd} @openuidev/cli@latest generate-api-key${fileArg}`,
    `(or create one at ${THESYS_KEYS_URL} and set THESYS_API_KEY yourself)`,
  ].join("\n");
}

export function getStartedMessage(o: {
  name: string;
  devCmd: string;
  dlxCmd: string;
  backendGettingStarted?: string;
  skillInstalled: boolean;
  envWritten: boolean;
  /** A key is in `.env` or already exported in the shell. */
  apiKeyAvailable: boolean;
  startDev: boolean;
  installCmd: string;
  dependencyInstalled: boolean;
}): string {
  const skillMessage = o.skillInstalled
    ? "The OpenUI agent skill was installed.\nAI coding assistants will use it to help you build with OpenUI.\n"
    : "";

  const envNote = o.envWritten ? "✅ .env created with your OpenUI Cloud API key + base URL." : "";

  // Without a key the app can't answer yet, so the key step replaces the usual
  // next steps and goes last, where it's read.
  const nextStep = !o.apiKeyAvailable
    ? ""
    : o.startDev
      ? `Starting the development server in "${o.name}"...\n\n> ${o.devCmd} run dev`
      : [
          `> cd ${o.name}`,
          ...(o.dependencyInstalled ? [] : [`> ${o.installCmd}`]),
          `> ${o.devCmd} run dev`,
        ].join("\n");

  const keyStep = o.apiKeyAvailable
    ? ""
    : [
        "Next, add your OpenUI API key. This signs you in and writes THESYS_API_KEY to .env:",
        "",
        `> cd ${o.name}`,
        ...(o.dependencyInstalled ? [] : [`> ${o.installCmd}`]),
        `> ${o.dlxCmd} @openuidev/cli@latest generate-api-key`,
        `> ${o.devCmd} run dev`,
      ].join("\n");

  const deployHint = `Share a preview:\n> ${o.dlxCmd} @openuidev/cli@latest deploy`;
  const feedbackHint = `Found a bug or have an idea?\n> ${o.dlxCmd} @openuidev/cli@latest feedback "<message>"`;

  const frameworkNote = o.backendGettingStarted?.replaceAll("{{packageManager}}", o.devCmd) ?? "";

  return `\n${[
    skillMessage.trim(),
    "Done!",
    envNote,
    frameworkNote,
    nextStep,
    deployHint,
    feedbackHint,
    keyStep,
  ]
    .filter(Boolean)
    .join("\n\n")}\n`;
}
