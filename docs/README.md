# OpenUI Docs

Documentation site for the OpenUI SDK, built with [Next.js 16](https://nextjs.org) + [Fumadocs](https://fumadocs.dev) + the OpenUI Design System.

## Setup

This project lives at `js/packages/docs-v3` inside the pnpm workspace, with a symlink at `repo/docs-v3` for convenience. It links `@openuidev/react-core` and `@openuidev/react-ui` from the monorepo via `workspace:^`.

```bash
# Install from workspace root
cd js && pnpm install

# Dev/build from docs-v3 (either path works)
cd js/packages/docs-v3   # or cd docs-v3 (symlink)
pnpm dev
pnpm build
```

## Project structure

```
docs-v3/
├── app/
│   ├── layout.tsx                          # Root layout (html, body, fonts, providers)
│   ├── global.css                          # Global styles + design-system CSS imports
│   │
│   ├── (home)/                             # Landing page (no docs layout)
│   │   ├── layout.tsx                      # DocsNavbar + content wrapper
│   │   └── page.tsx
│   │
│   ├── docs/                               # Fumadocs documentation pages
│   │   ├── layout.tsx                      # DocsLayout (sidebar, nav)
│   │   └── [[...slug]]/page.tsx            # Catch-all rendering MDX from content/docs/
│   │
│   ├── (design-system)/                    # Route group — bypasses Fumadocs layout
│   │   └── docs/design-system/             # Serves /docs/design-system/*
│   │       ├── layout.tsx                  # AppThemeProvider + DS TopNav shell
│   │       ├── page.tsx                    # Redirects → /docs/design-system/foundation/colors
│   │       ├── blocks/                     # Component block previews
│   │       ├── foundation/                 # Design tokens (colors, spacing, etc.)
│   │       └── compose/                    # Composition examples
│   │
│   ├── api/search/route.ts                 # Search endpoint
│   ├── og/docs/[...slug]/route.tsx         # OG image generation
│   └── llms.txt/, llms-full.txt/, llms.mdx/  # LLM-friendly content endpoints
│
├── components/                             # Docs-site components
│   ├── docs-navbar.tsx                     # Top navbar (section tabs, search, GitHub)
│   └── ai/page-actions.tsx                 # Copy/open actions on doc pages
│
├── content/docs/                           # MDX content (Fumadocs source)
│   ├── meta.json                           # Root sidebar config
│   ├── introduction/                       # Getting started guides
│   ├── generative-ui/                      # GenUI docs
│   ├── chat/                               # Chat SDK docs
│   └── api-reference/                      # API reference
│
├── shared/design-system/                   # Design system shared code (non-route)
│   ├── components/                         # UI components (SideNav, TopNav, preview/, etc.)
│   ├── config/                             # Navigation config, compose example data
│   ├── styles/                             # CSS custom properties (colors, spacing, typography)
│   └── types/                              # TypeScript types
│
├── lib/                                    # Utilities
│   ├── source.ts                           # Fumadocs source config
│   ├── layout.shared.tsx                   # Shared layout options
│   └── cn.ts                               # className merge utility
│
├── next.config.mjs                         # Redirects, rewrites, turbopack root
├── tsconfig.json                           # Path aliases: @/*, @design-system/*
├── source.config.ts                        # Fumadocs MDX collection config
└── package.json
```

## How it works

### Documentation pages (Fumadocs)

MDX files in `content/docs/` are rendered by the catch-all route at `app/docs/[[...slug]]/page.tsx`. Fumadocs handles sidebar generation from `meta.json` files, search indexing, and page layout.

Each top-level section (`introduction`, `generative-ui`, `chat`, `api-reference`) has `"root": true` in its `meta.json`, which gives it an isolated sidebar.

### Design System pages

The design system lives at `/docs/design-system/*` and uses a **route group** `(design-system)` to avoid inheriting the Fumadocs `DocsLayout` (which would add the Fumadocs sidebar). It has its own layout with `AppThemeProvider`, a `TopNav` (Blocks / Foundation / Compose), and section-specific `SideNav` components.

Shared code is in `shared/design-system/` and imported via the `@design-system/*` path alias.

### Navigation

A custom `DocsNavbar` component (`components/docs-navbar.tsx`) provides top-level horizontal tabs: Introduction, Generative UI, Design System, Chat, API Reference. It replaces Fumadocs' default nav and is shared between the homepage and docs layouts.

## Path aliases

| Alias              | Resolves to                | Usage                                      |
| ------------------ | -------------------------- | ------------------------------------------ |
| `@/*`              | `./` (project root)        | Docs-site code (`@/components/`, `@/lib/`) |
| `@design-system/*` | `./shared/design-system/*` | Design system shared code                  |

## Key dependencies

- **`@openuidev/react-core`**, **`@openuidev/react-ui`** — Linked from the monorepo via `workspace:^`. Provides `ThemeProvider`, chart components, and UI primitives used by the design system.
- **`fumadocs-core` / `fumadocs-ui` / `fumadocs-mdx`** — Documentation framework.
- **`prism-react-renderer`** — Syntax highlighting in design system code blocks.

## Adding documentation

1. Create an MDX file in the appropriate `content/docs/<section>/` directory.
2. Add the page to the section's `meta.json` `pages` array.
3. The page will automatically appear in the sidebar and be available at `/docs/<section>/<slug>`.

## Adding design system pages

1. Add the route page in `app/(design-system)/docs/design-system/<section>/`.
2. Add shared components/config in `shared/design-system/`.
3. Update `shared/design-system/config/navigation.ts` with the new nav items.
