export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export interface NestedNavItem {
  id: string;
  label: string;
  href?: string;
  items?: NestedNavItem[];
}

export interface NavGroup {
  id: string;
  label: string;
  items: NestedNavItem[];
}

export type NavSection = NavGroup | NestedNavItem;
