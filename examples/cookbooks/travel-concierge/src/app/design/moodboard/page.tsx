import type { Metadata } from "next";
import MoodboardCanvas from "./canvas";

export const metadata: Metadata = {
  title: "Moodboard | OpenUI design exploration",
  description: "Prompt an agent and watch it compose a moodboard of OpenUI pieces on a canvas.",
};

export default function Page() {
  return <MoodboardCanvas />;
}
