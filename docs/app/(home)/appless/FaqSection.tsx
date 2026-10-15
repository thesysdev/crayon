import {
  FaqSection as MarketingFaqSection,
  type MarketingFaq,
} from "../sections/FaqSection/FaqSection";

// Sources: thesysdev/appless README (Quick start, How it works, and
// Fork it and make it yours), and Rabi's New Marketing Pages document.
const faqs: MarketingFaq[] = [
  {
    question: "What is AppLess?",
    answer: [
      "AppLess is an open-source experiment in a phone without apps. Describe a task and it generates a native interface. Tap a row, card, or button to generate the next screen.",
    ],
  },
  {
    question: "Can it place orders, book trips, or send payments?",
    answer: [
      "Those actions are simulated. AppLess has no real service integrations behind them yet. Fork the project and connect your own tools to turn a generated screen into a working service.",
    ],
  },
  {
    question: "Does OUI-1 run on my phone?",
    answer: [
      "The native app connects to OUI-1 running on a GPU host through vLLM. The phone renders the interface; it does not run the model inside the app.",
    ],
  },
  {
    question: "Does AppLess use real information?",
    answer: [
      "Optional web and image tools can bring real places, prices, news, and photos into screens. Without those tools, the model generates sample content. Actions remain simulated until you add integrations.",
    ],
  },
  {
    question: "Does it work on iOS and Android?",
    answer: [
      "Yes. One component contract renders as Cupertino on iOS and Material 3 on Android. The same generated interface uses the native design system for each platform.",
    ],
  },
  {
    question: "Can I customize it?",
    answer: [
      "Yes. AppLess is MIT licensed. Fork it, add components to its contract, and connect tools for your own data and actions. The README includes setup instructions and integration ideas.",
    ],
  },
];

export function FaqSection() {
  return <MarketingFaqSection faqs={faqs} titleId="appless-faq" />;
}
