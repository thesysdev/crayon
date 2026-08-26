import type { Metadata } from "next";
import { Footer } from "../sections/Footer/Footer";
import { BenchmarksContent } from "./BenchmarksContent";

export const metadata: Metadata = {
  title: "Benchmarks | OpenUI",
  description: `We generated the same 46 interfaces with 6 models and 3 UI formats. OpenUI produced the fewest blank screens, used the fewest tokens, and cost the least on every priced model.`,
};

export default function BenchmarksPage() {
  return (
    <>
      <BenchmarksContent />
      <Footer />
    </>
  );
}
