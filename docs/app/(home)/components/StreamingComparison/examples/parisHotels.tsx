import {
  CalendarHeart,
  Coins,
  Heart,
  Sparkles,
  TrainFront,
  UtensilsCrossed,
  Waves,
  Wifi,
} from "lucide-react";
import type { ComparisonExample } from "../types";

/* The homepage's first example: a modern hotel in Paris, as a wall of text
   versus hotel cards and quick facts. */
export const PARIS_HOTELS: ComparisonExample = {
  prompt: "I need a hotel with a modern design in Paris",
  left: {
    label: "Without",
    follow: true,
    blocks: [
      { type: "heading", text: "Modern Hotels in Paris" },
      {
        type: "paragraph",
        text: "Paris offers a wide selection of modern-design hotels that blend contemporary architecture, thoughtful interiors, and premium hospitality. Many of these properties are located in central neighborhoods close to major landmarks, shopping districts, and cultural sites, making them convenient bases for both first-time visitors and returning travelers. Modern hotels in the city often emphasize clean lines, natural materials, curated lighting, and spacious layouts, while still preserving elements of Parisian elegance.",
      },
      {
        type: "bullets",
        items: [
          "Hotel Plaza Athénée — Situated near the Champs-Élysées, this property combines classic Parisian prestige with refined modern upgrades. Guests often choose it for its courtyard dining spaces, luxury spa, and polished service.",
          "Four Seasons Hotel George V — A historic landmark that has been carefully modernized, offering spacious rooms, world-class dining, and extensive wellness offerings, with a blend of heritage architecture and modern interiors.",
        ],
      },
      {
        type: "paragraph",
        text: "Across the Paris hospitality market, occupancy rates in upscale hotels have remained relatively consistent in recent months, indicating stable demand rather than sharp seasonal swings. Visitors planning a stay should keep in mind that the local currency is the Euro, and everyday experiences often include sampling classic Parisian foods such as macarons, crêpes, pastries, and café dishes. The city's public transportation system, including the metro, buses, and suburban trains, is extensive and efficient.",
      },
      {
        type: "paragraph",
        text: "Nearby, travellers often visit the Musée d'Orsay on the Left Bank, take a sunset cruise along the Seine, browse the design boutiques of Le Marais, or spend an evening moving between the wine bars of Saint-Germain-des-Prés. Many of these experiences can be booked in advance, and some hotels arrange them through their concierge desks.",
      },
      {
        type: "paragraph",
        text: "In terms of timing, spring is popular for its mild weather, blooming streets, and longer daylight hours, while early autumn offers comfortable temperatures and fewer crowds.",
      },
    ],
  },
  right: {
    label: "With OpenUI",
    blocks: [
      { type: "heading", text: "Modern Hotels in Paris" },
      {
        type: "cards",
        cards: [
          {
            image: "/appless/hotel-casa.jpg",
            imageAlt: "Hotel Plaza Athénée",
            badge: { label: "Free Wifi", icon: <Wifi aria-hidden />, tone: "green" },
            title: "Hotel Plaza Athénée",
            description: "Haute couture suites; courtyard dining; Dior spa; near Champs-Élysées.",
            action: "Book",
          },
          {
            image: "/appless/hotel-larch.jpg",
            imageAlt: "Four Seasons George V",
            badge: { label: "Family-friendly", icon: <Heart aria-hidden />, tone: "purple" },
            title: "Four Seasons George V",
            description: "Landmark hotel with opulent rooms, Michelin dining, and a lavish spa.",
            action: "Book",
          },
          {
            image: "/appless/hotel-harbor.jpg",
            imageAlt: "Shangri-La Paris",
            badge: { label: "Spa", icon: <Waves aria-hidden />, tone: "blue" },
            title: "Shangri-La Paris",
            description: "Eiffel Tower views from a former palace; pool and two-star dining.",
            action: "Book",
          },
          {
            image: "/appless/hotel-mill.jpg",
            imageAlt: "Le Royal Monceau",
            badge: { label: "Design pick", icon: <Sparkles aria-hidden />, tone: "amber" },
            title: "Le Royal Monceau",
            description: "Philippe Starck interiors, an art gallery and a private cinema.",
            action: "Book",
          },
          {
            image: "/appless/hotel-palm.jpg",
            imageAlt: "Hôtel Lutetia",
            badge: { label: "Free Wifi", icon: <Wifi aria-hidden />, tone: "green" },
            title: "Hôtel Lutetia",
            description: "Left Bank Art Deco icon, renovated with a calm, modern edge.",
            action: "Book",
          },
        ],
      },
      {
        type: "gallery",
        images: [
          { src: "/appless/hotel-larch.jpg", alt: "A design hotel facade in timber and stone" },
          { src: "/appless/hotel-casa.jpg", alt: "A modern hotel with a pool" },
          { src: "/appless/hotel-harbor.jpg", alt: "A waterfront hotel terrace at dusk" },
          { src: "/appless/hotel-mill.jpg", alt: "A white modernist hotel" },
          { src: "/appless/hotel-palm.jpg", alt: "A hotel with palm-lined grounds" },
        ],
      },
      { type: "subheading", text: "Highlights" },
      {
        type: "facts",
        layout: "rules",
        facts: [
          { icon: <Coins aria-hidden />, label: "Currency", value: "Euro (€)" },
          {
            icon: <UtensilsCrossed aria-hidden />,
            label: "Local cuisine",
            value: "Macarons, Crêpes",
          },
          { icon: <TrainFront aria-hidden />, label: "Getting around", value: "Metro, Bus" },
          {
            icon: <CalendarHeart aria-hidden />,
            label: "Best time to visit",
            value: "April to October",
          },
        ],
      },
    ],
  },
};
