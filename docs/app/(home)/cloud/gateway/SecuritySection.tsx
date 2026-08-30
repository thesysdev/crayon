import type { GridFeature } from "../../sections/FeatureGridSection/FeatureGridSection";
import { EnterpriseSection } from "../EnterpriseSection";

const FEATURES: GridFeature[] = [
  {
    icon: "shield",
    title: "Zero data retention",
    description: "Chat Completions requests have zero data retention by default on paid models.",
  },
  {
    icon: "database",
    title: "Data training controls",
    description: "Your data is not used for training, except with free models.",
  },
  {
    icon: "shield",
    title: "Compliance",
    description: (
      <>
        GDPR, SOC 2, and ISO 27001 details are available in the{" "}
        <a href="https://trust.thesys.dev" target="_blank" rel="noreferrer">
          Trust Center
        </a>
        .
      </>
    ),
  },
  {
    icon: "cloud",
    title: "Provider fallbacks",
    description:
      "If a provider is unavailable, Gateway serves the same model through another provider.",
  },
  {
    icon: "pulse",
    title: "Service uptime",
    description: (
      <>
        View current and historical status at{" "}
        <a href="https://status.thesys.dev" target="_blank" rel="noreferrer">
          status.thesys.dev
        </a>
        .
      </>
    ),
  },
  {
    icon: "devices",
    title: "Private deployment",
    description: "Self-hosting and VPC deployments are available on Scale.",
  },
];

export function SecuritySection() {
  return (
    <EnterpriseSection
      title="Built for enterprise requirements"
      titleId="gateway-security"
      features={FEATURES}
      linkLabel="View the Trust Center"
    />
  );
}
