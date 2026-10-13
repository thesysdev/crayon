# Changesets

Releases are automated with [changesets](https://github.com/changesets/changesets).

- PRs that change anything under `packages/` should include a changeset: run
  `pnpm changeset`, pick the affected packages and bump levels, and commit the
  generated file. Docs/CI-only changes don't need one.
- On every push to `main`, CI maintains a **Version Packages** PR carrying all
  pending bumps and changelogs. Merging that PR publishes to npm, tags, and
  creates GitHub Releases. Merge it whenever a release should go out.
- A breaking change escapes consumers' `^` ranges: a **major** for packages at
  1.0 or above (lang-core, react-lang), a **minor** for packages still on 0.x.
  Otherwise a **patch** is the normal bump.
- Packages that runtime-depend on a bumped package are patch-bumped
  automatically. When that dependency takes a breaking bump, give the dependent
  a breaking bump too, or a `^` install of the old version pulls the new
  dependency.
- Internal `peerDependencies` use hand-maintained bounded ranges (e.g.
  `">=0.3.0 <0.4.0"`), never `workspace:` protocol. If your change makes a
  package require a newer version of an internal peer, move that window in the
  same PR. See `docs/openui-release-management.md` in the design docs repo for
  the full rationale.
