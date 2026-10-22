import {
  FaqSection as MarketingFaqSection,
  type MarketingFaq,
} from "../sections/FaqSection/FaqSection";

// Sources: /blog/oui-1, the OUI-1 model card (Intended use, How to use),
// and /docs/openui-lang. No unconfirmed throughput claim is added here.
const faqs: MarketingFaq[] = [
  {
    question: "What is OUI-1?",
    answer: [
      "OUI-1 is an open-weight model built for Generative UI. It is a finetune of Google's DiffusionGemma that turns a request into OpenUI Lang, which OpenUI renders into interactive components.",
    ],
  },
  {
    question: "Why use it over a general-purpose model?",
    answer: [
      "OUI-1 is trained to generate connected, valid interfaces. It scored 71.7% on the Generative UI Benchmark, compared with 13.0% for its base DiffusionGemma model, using the same benchmark protocol.",
    ],
  },
  {
    question: "Can I use my own components?",
    answer: [
      "Yes. Give OUI-1 your component signatures in the system prompt. It generates OpenUI Lang from that library, so the output can use your components and design system.",
    ],
  },
  {
    question: "What hardware does it need?",
    answer: [
      "OUI-1 has 26B total parameters, with 4B active per token. FP8 weights occupy about 25.8 GiB, plus runtime and cache memory. Check the model card for serving settings and plan GPU memory for your workload.",
    ],
  },
  {
    question: "How do I connect it to OpenUI?",
    answer: [
      "Serve OUI-1 with vLLM 0.24 or newer, generate a system prompt from your component library, and call its OpenAI-compatible endpoint. Render the streamed OpenUI Lang with an OpenUI renderer.",
    ],
  },
  {
    question: "Can I use it commercially?",
    answer: [
      "The weights are released under Apache 2.0. You can download, adapt, and deploy them on your own infrastructure, subject to the license terms.",
    ],
  },
];

export function FaqSection() {
  return <MarketingFaqSection faqs={faqs} titleId="oui-1-faq" />;
}
