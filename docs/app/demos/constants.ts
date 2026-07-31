import { OPENUI_VS_JSON_MODELS } from "../../lib/demo-models";

export type Theme = "system" | "light" | "dark";
export type Status = "idle" | "streaming" | "done" | "error";

export const MODELS = OPENUI_VS_JSON_MODELS;
export type Model = (typeof MODELS)[number];

export const STARTER_PROMPTS = [
  "Weather dashboard",
  "Pricing cards",
  "Kanban board",
  "Login form",
  "Data table",
];
