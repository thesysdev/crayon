import { ExternalTextLink } from "../../components/ExternalTextLink/ExternalTextLink";
import type { GridFeature } from "../../sections/FeatureGridSection/FeatureGridSection";
import { EnterpriseSection } from "../EnterpriseSection";

type StatusSummary = {
  page?: {
    status?: "UP" | "HASISSUES" | "UNDERMAINTENANCE";
  };
};

async function getServiceStatus() {
  try {
    const response = await fetch("https://status.thesys.dev/summary.json", {
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;

    const summary = (await response.json()) as StatusSummary;
    return summary.page?.status ?? null;
  } catch {
    return null;
  }
}

export async function SecuritySection() {
  const serviceStatus = await getServiceStatus();
  const statusCopy = serviceStatus
    ? {
        UP: "All systems operational right now.",
        HASISSUES: "An active incident is being resolved.",
        UNDERMAINTENANCE: "Scheduled maintenance is in progress.",
      }[serviceStatus]
    : "See current system status.";

  const features: GridFeature[] = [
    {
      icon: "shield",
      title: "Private by default",
      description: "Chat Completions requests use zero data retention by default.",
    },
    {
      icon: "database",
      title: "Your data stays yours",
      description: "Your Gateway data stays private and is never used to train models.",
    },
    {
      icon: "shield",
      title: "Faster security reviews",
      description: (
        <>
          Find GDPR, SOC 2, and ISO 27001 evidence in the{" "}
          <ExternalTextLink href="https://trust.thesys.dev">Trust centre</ExternalTextLink>
          {"."}
        </>
      ),
    },
    {
      icon: "cloud",
      title: "Stay online",
      description: "Gateway reroutes the same model through another provider.",
    },
    {
      icon: "pulse",
      title: "Live service status",
      description: (
        <>
          {statusCopy}{" "}
          <ExternalTextLink href="https://status.thesys.dev">View status</ExternalTextLink>
          {"."}
        </>
      ),
    },
    {
      icon: "devices",
      title: "Deploy your way",
      description: "Deploy in your VPC or self-host in your own environment.",
    },
  ];

  return (
    <EnterpriseSection
      title="Built for enterprise requirements"
      titleId="gateway-security"
      features={features}
    />
  );
}
