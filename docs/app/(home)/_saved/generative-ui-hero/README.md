# Saved: "Open Standard for Generative UI" hero (15 Oct 2026)

The home hero we built on 15 Oct, parked so the home fold could go back to
how it was on main. Nothing here is imported or built; the `.txt` copies keep
Next and TypeScript from picking the files up.

What it had:

- No "OpenUI" wordmark; a centred "Open Standard for Generative UI" headline
  in Inter Display.
- A two-line outcome under it: "Make your AI apps and agents respond" then a
  shuffling "with [icon] Charts / Tables / Forms / Dashboards / Reports /
  Slides" (Interactive UI has no icon). The shuffle is
  `app/(home)/components/ShufflingWord/`, which stays in place, unused.
- Mobile fixes: the headline always wraps, and the install command shows in
  full (scaled to fit) instead of the scrolling ticker.

Files:

- `hero.patch` — the whole change against the committed branch
  (`git apply` from the repo root to bring it back).
- `page.tsx.txt`, `page.module.css.txt`, `HeroSection.tsx.txt`,
  `HeroSection.module.css.txt` — full copies of those files as they were.
