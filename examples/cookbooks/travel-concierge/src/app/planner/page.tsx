import type { Metadata } from "next";
import { dsFontVariables } from "../../design-system/fonts";
import { tokensCss } from "../../design-system/tokens";
import { handFont } from "../horizontal-journal/fonts";
import HorizontalJournal from "./journal";
import styles from "./journal.module.css";
import "./ui-font.css";

export const metadata: Metadata = {
  title: "Planner | OpenUI design exploration",
  description: "A trip told as a journal you scroll sideways.",
};

export default function PlannerPage() {
  return (
    <main className={`journal-page planner-page ${dsFontVariables} ${handFont.variable} ${styles.page}`}>
      <style dangerouslySetInnerHTML={{ __html: tokensCss(".journal-page") }} />
      <HorizontalJournal />
    </main>
  );
}
