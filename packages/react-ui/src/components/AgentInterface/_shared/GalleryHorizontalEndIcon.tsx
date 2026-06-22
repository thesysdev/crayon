import type { SVGProps } from "react";

export const GalleryHorizontalEndIcon = ({
  size = "1em",
  ...props
}: SVGProps<SVGSVGElement> & { size?: number | string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M2.5 19.323A2 2 0 0 1 2 18V6a2 2 0 0 1 .5-1.323" />
    <path d="M6.5 19.823A2 2 0 0 1 6 18.49V5.5a2 2 0 0 1 .268-1" />
    <rect x="10" y="4" width="12" height="16" rx="2" />
  </svg>
);
