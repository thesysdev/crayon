import { destinations } from "./home";

// The 3D icon for a trip or a place name, shared by the board's title and the Itinerary spread.

// Words in a trip's name that point to one of the landscape icons, when no place icon fits.
const landscapeWords: [RegExp, string][] = [
  [/beach|coast|sea|surf|shore/i, "beach"],
  [/island|isle|atoll/i, "island"],
  [/mountain|alps|peak|hike|trek/i, "mountains"],
  [/snow|ski/i, "snow-peak"],
  [/lake/i, "lake"],
  [/desert|dune|sahara/i, "desert"],
  [/forest|jungle|rainforest/i, "forest"],
  [/waterfall|falls/i, "waterfall"],
  [/village|countryside|vineyard|farm/i, "countryside"],
];

/** The trip's 3D icon: its place's own (by city, landmark or country), else the closest landscape. */
export function iconFor(place = "") {
  const text = place.toLowerCase();
  const hit = destinations.find(
    (d) => text.includes(d.name.toLowerCase()) || text.includes(d.icon.replace(/-/g, " ")) || text.includes(d.country.toLowerCase()),
  );
  return hit?.icon ?? landscapeWords.find(([words]) => words.test(place))?.[1] ?? "city";
}

