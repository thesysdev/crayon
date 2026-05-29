import { clsx, type ClassValue } from "clsx";

/**
 * Class-name combiner. bklit-ui uses clsx + tailwind-merge; this package styles
 * with SCSS (semantic class names, not Tailwind utilities), so plain clsx is
 * the faithful behavior without the utility-merge step.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
