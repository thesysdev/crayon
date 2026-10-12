// SVGs live in public/brand-icons/models (LobeHub Icons, MIT).
// Monochrome icons are drawn as a mask in the text colour so they stay visible in dark mode.
type Icon = { src: string; mono?: boolean };

const icon = (name: string): Icon => ({ src: `/brand-icons/models/${name}.svg` });
const mono = (name: string): Icon => ({ ...icon(name), mono: true });

// OpenRouter author slug to its brand icon. Authors without an entry show their initial.
const AUTHOR_ICONS: Record<string, Icon> = {
  "aion-labs": icon("aionlabs"),
  amazon: icon("nova"),
  anthropic: mono("anthropic"),
  "arcee-ai": icon("arcee"),
  bytedance: icon("bytedance"),
  "bytedance-seed": icon("bytedance"),
  cognitivecomputations: mono("dolphin"),
  cohere: icon("cohere"),
  deepseek: icon("deepseek"),
  "dots-studio": mono("dotsstudio"),
  fireworks: icon("fireworks"),
  "ibm-granite": mono("ibm"),
  inception: mono("inception"),
  inclusionai: icon("antgroup"),
  "inference-net": mono("inference"),
  liquid: mono("liquid"),
  meituan: icon("longcat"),
  meta: icon("meta"),
  "meta-llama": icon("meta"),
  microsoft: icon("microsoft"),
  minimax: icon("minimax"),
  mistralai: icon("mistral"),
  moonshotai: mono("moonshot"),
  morph: icon("morph"),
  nousresearch: mono("nousresearch"),
  nvidia: icon("nvidia"),
  openai: mono("openai"),
  openrouter: icon("openrouter"),
  perceptron: mono("perceptron"),
  perplexity: icon("perplexity"),
  poolside: icon("poolside"),
  qwen: icon("qwen"),
  rekaai: mono("reka"),
  relace: mono("relace"),
  sakana: icon("sakana"),
  stepfun: icon("stepfun"),
  tencent: icon("tencent"),
  upstage: icon("upstage"),
  "x-ai": mono("xai"),
  xiaomi: mono("xiaomimimo"),
  "z-ai": mono("zai"),
};

/** Brand icon for a model ID such as "google/gemini-3.6-flash" or "~openai/gpt-sol-latest". */
export function iconFor(id: string): Icon | undefined {
  const slug = id.replace(/^~/, "");
  if (slug.startsWith("google/gemini")) return icon("gemini");
  if (slug.startsWith("google/gemma")) return icon("gemma");
  if (slug.startsWith("google/")) return icon("google");
  return AUTHOR_ICONS[slug.split("/")[0]];
}
