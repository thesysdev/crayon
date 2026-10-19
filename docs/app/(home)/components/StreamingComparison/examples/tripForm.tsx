import {
  BedDouble,
  Building2,
  Landmark,
  MapPin,
  Martini,
  Mountain,
  Sun,
  TreePalm,
  UtensilsCrossed,
  Waves,
} from "lucide-react";
import type { ComparisonExample } from "../types";

/* Forms: "Help me plan my next vacation" (from the cloud demo's starters).
   Plain text asks a list of questions; OpenUI asks with a form. */
export const TRIP_FORM: ComparisonExample = {
  prompt: "Help me plan my next vacation",
  left: {
    label: "Without",
    follow: true,
    blocks: [
      { type: "heading", text: "Let's Plan Your Vacation" },
      {
        type: "paragraph",
        text: "I'd be happy to help you plan your next vacation! To give you the best recommendations, I'll need a few details first. Could you answer the following questions?",
      },
      {
        type: "bullets",
        items: [
          "Where would you like to go? Do you have a specific destination in mind, or should I suggest some options?",
          "When are you planning to travel, and for how many days?",
          "How many people will be travelling, and will there be any children?",
          "What is your approximate budget per person, including flights and accommodation?",
          "What kind of experiences are you interested in — for example beaches, food, culture, adventure, nightlife or relaxation?",
          "Do you have any preferences for accommodation, such as hotels, resorts, or rentals?",
        ],
      },
      {
        type: "paragraph",
        text: "Once you reply with these details, I'll put together a suggested itinerary with places to stay, things to do and an estimated budget for your trip.",
      },
    ],
  },
  right: {
    label: "With OpenUI",
    blocks: [
      { type: "heading", text: "Plan your next vacation" },
      { type: "muted", text: "Tell me a little about the trip and I'll build the itinerary." },
      {
        type: "form",
        submit: "Plan my trip",
        fields: [
          {
            kind: "text",
            label: "Where to?",
            value: "Lisbon, Portugal",
            icon: <MapPin aria-hidden />,
          },
          {
            kind: "dateStrip",
            label: "When",
            month: "May 2026",
            days: [
              { dow: "S", day: 10 },
              { dow: "M", day: 11 },
              { dow: "T", day: 12 },
              { dow: "W", day: 13 },
              { dow: "T", day: 14 },
              { dow: "F", day: 15 },
              { dow: "S", day: 16 },
              { dow: "S", day: 17 },
              { dow: "M", day: 18 },
              { dow: "T", day: 19 },
            ],
            from: 2,
            to: 8,
          },
          { kind: "stepper", label: "Who's going", value: 2, unit: "adults" },
          {
            kind: "tiles",
            label: "What do you enjoy?",
            columns: 3,
            options: [
              { label: "Food", icon: <UtensilsCrossed aria-hidden /> },
              { label: "Culture", icon: <Landmark aria-hidden /> },
              { label: "Beaches", icon: <Waves aria-hidden /> },
              { label: "Nightlife", icon: <Martini aria-hidden /> },
              { label: "Hiking", icon: <Mountain aria-hidden /> },
              { label: "Relaxing", icon: <Sun aria-hidden /> },
            ],
            selected: ["Food", "Culture"],
          },
          {
            kind: "tiles",
            label: "Where to stay",
            columns: 3,
            options: [
              { label: "Boutique hotel", icon: <BedDouble aria-hidden /> },
              { label: "Apartment", icon: <Building2 aria-hidden /> },
              { label: "Resort", icon: <TreePalm aria-hidden /> },
            ],
            selected: ["Boutique hotel"],
          },
          {
            kind: "chips",
            label: "Budget per person",
            options: ["Under $1k", "$1–2k", "$2–4k", "$4k+"],
            selected: ["$1–2k"],
          },
        ],
      },
    ],
  },
};
