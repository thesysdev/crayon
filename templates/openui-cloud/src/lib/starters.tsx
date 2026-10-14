import { PromptTemplate } from "@openuidev/react-ui";
import {
  Car,
  Code,
  Flag,
  Rocket,
  Scale,
  Search,
  TreePalm,
  Zap,
} from "lucide-react";

// One mark for both themes: the mascot reads on light and dark surfaces.
export const OPENUI_LOGO = "/openui-logo.svg";

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    displayText: "Research",
    prompt: "Research ",
    icon: <Search size={16} />,
    completions: [
      {
        displayText: "The rise of reusable rockets and commercial spaceflight",
        prompt: "the rise of reusable rockets and commercial spaceflight",
        icon: <Rocket size={16} />,
      },
      {
        displayText: "How Formula 1 became a global business",
        prompt: "how Formula 1 became a global business",
        icon: <Flag size={16} />,
      },
      {
        displayText: "Why electric vehicles are changing transportation",
        prompt: "why electric vehicles are changing transportation",
        icon: <Zap size={16} />,
      },
    ],
  },
  {
    displayText: "Compare",
    prompt: "Compare ",
    icon: <Scale size={16} />,
    completions: [
      {
        displayText: "Leading electric vehicles for long road trips",
        prompt: "leading electric vehicles for long road trips",
        icon: <Car size={16} />,
      },
      {
        displayText: "Popular frontend frameworks for a new web app",
        prompt: "popular frontend frameworks for a new web app",
        icon: <Code size={16} />,
      },
      {
        displayText: "Top destinations for a summer vacation",
        prompt: "top destinations for a summer vacation",
        icon: <TreePalm size={16} />,
      },
    ],
  },
];
