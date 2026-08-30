import type { Integration } from "./data";

type IntegrationLogoProps = {
  integration: Pick<Integration, "logo" | "name">;
  className: string;
};

export function IntegrationLogo({ integration, className }: IntegrationLogoProps) {
  return (
    <span className={className} aria-hidden="true">
      {/* Brand marks are intentionally rendered at their intrinsic aspect ratio. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src={integration.logo ?? "/favicon.svg"} />
    </span>
  );
}
