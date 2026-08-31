import { ExternalTextLink } from "../../components/ExternalTextLink/ExternalTextLink";
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
    title: "No training on your data",
    description: "Your data is not used for training, except with free models.",
  },
  {
    icon: "shield",
    title: "Compliance",
    description: (
      <>
        GDPR, SOC 2, and ISO 27001 details are available in the{" "}
        <ExternalTextLink href="https://trust.thesys.dev">Trust centre</ExternalTextLink>.
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
        View current and historical uptime on our{" "}
        <ExternalTextLink href="https://status.thesys.dev">service status page</ExternalTextLink>.
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
    />
  );
}
