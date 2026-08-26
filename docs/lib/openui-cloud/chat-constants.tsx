import type { PromptTemplate } from "@openuidev/react-ui";
import { FileText, Presentation } from "lucide-react";

export const OPENUI_CLOUD_LOGO_URL = "/shiro-logo.svg";

export const OPENUI_CLOUD_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    displayText: "Create a presentation",
    prompt: "Create a presentation about ",
    icon: <Presentation size={16} />,
    completions: [
      {
        displayText: "The rise of reusable rockets and commercial spaceflight",
        prompt: "the rise of reusable rockets and commercial spaceflight",
        icon: <></>,
      },
      {
        displayText: "How Formula 1 became a global business",
        prompt: "how Formula 1 became a global business",
        icon: <></>,
      },
      {
        displayText: "Why electric vehicles are changing transportation",
        prompt: "why electric vehicles are changing transportation",
        icon: <></>,
      },
    ],
  },
  {
    displayText: "Write a report",
    prompt: "Write a report on ",
    icon: <FileText size={16} />,
    completions: [
      {
        displayText: "Global coffee market trends and consumer preferences",
        prompt: "global coffee market trends and consumer preferences",
        icon: <></>,
      },
      {
        displayText: "The state of the electric vehicle market in 2026",
        prompt: "the state of the electric vehicle market in 2026",
        icon: <></>,
      },
      {
        displayText: "Global travel trends and emerging destinations",
        prompt: "global travel trends and emerging destinations",
        icon: <></>,
      },
    ],
  },
];

export const OPENUI_CLOUD_STARTERS = [
  {
    displayText: "Relive the FIFA World Cup 2026",
    prompt: "Relive the FIFA World Cup 2026.",
    icon: <></>,
  },
  {
    displayText: "Create a report on global coffee trends",
    prompt: "Create a report on global coffee trends.",
    icon: <></>,
  },
  {
    displayText: "Help me plan my next vacation",
    prompt: "Help me plan my next vacation.",
    icon: <></>,
  },
];
