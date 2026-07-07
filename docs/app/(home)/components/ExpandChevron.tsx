/** Small down-caret used as the expand/collapse affordance on mobile accordion
 *  rows (feature grid, cloud, steps). Rotates via CSS when the row is open. */
export function ExpandChevron({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}
