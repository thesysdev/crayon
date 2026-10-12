import type { Metadata } from "next";
import { dsFontVariables } from "../../design-system/fonts";
import { tokensCss } from "../../design-system/tokens";
import { handFont } from "./fonts";
import HorizontalJournal from "./journal";
import styles from "./journal.module.css";

export const metadata: Metadata = {
  title: "Horizontal journal | OpenUI design exploration",
  description: "A trip told as a journal you scroll sideways.",
};

export default function Page() {
  return (
    <main className={`journal-page ${dsFontVariables} ${handFont.variable} ${styles.page}`}>
      <style dangerouslySetInnerHTML={{ __html: tokensCss(".journal-page") }} />
      <HorizontalJournal />
    </main>
  );
}
