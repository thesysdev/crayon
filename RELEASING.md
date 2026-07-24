# Releasing OpenUI packages

OpenUI uses Changesets to manage independently versioned packages. Contributors
describe unreleased consumer-facing changes in small Markdown files; automation
collects those files into one rolling release pull request. Merging that release
pull request publishes only the packages whose versions changed.

## Version policy

- **Patch**: backward-compatible fixes and small improvements.
- **Minor**: new functionality and clearly documented breaking changes while a
  package is below `1.0.0`.
- **Major**: the deliberate transition to `1.0.0`, or a breaking change after a
  package has reached `1.0.0`.

Every package is versioned independently. `fixed` and `linked` release groups
are intentionally disabled.

Changeset summaries are release notes for package consumers. Describe the
observable impact rather than the implementation work. Call out a pre-1.0
breaking change explicitly even though it uses a minor bump.

## Contributor workflow

After changing a published package, run:

```sh
pnpm changeset
```

The prompt asks you to:

1. Select every published package affected by the change.
2. Choose patch, minor, or major according to the policy above.
3. Write a concise consumer-facing release summary.

Commit the generated `.changeset/*.md` file in the same pull request as the
feature or fix.

A changeset is not required for changes that cannot affect a published
artifact, such as repository-only CI, issue templates, or documentation outside
a package. If files inside a published package change but no release is
intended—for example, tests or maintainer-only documentation—record the reviewed
exception explicitly:

```sh
pnpm changeset --empty
```

Commit the generated empty changeset. An empty changeset applies to the whole
pull request and must not be mixed with package release entries.

CI verifies that every changed published package appears in a newly added
changeset. It validates syntax, package names, and the release calculation, but
reviewers remain responsible for the selected SemVer severity and the quality
of the summary. The bot-created `changeset-release/*` version PR is exempt from
presence enforcement because it intentionally consumes and removes the source
changesets.

### Browser bundle rule

`@openuidev/browser-bundle` contains compiled code from
`@openuidev/react-ui` and `@openuidev/react-lang`. When either source package
has a release entry, the same changeset or another changeset in the pull request
must include an explicit release for `@openuidev/browser-bundle`. A patch is
normally appropriate unless the browser bundle's own public contract requires a
larger bump.

If a `react-ui` or `react-lang` change is intentionally not released, use the
documented empty-changeset exception instead.

## Local commands

```sh
# Create a changeset
pnpm changeset

# Inspect pending release calculations
pnpm changeset:status

# Validate this branch against origin/main
pnpm changeset:status --since=origin/main
pnpm changeset:validate --base=origin/main

# Apply pending versions, changelogs, internal ranges, and lockfile changes
pnpm version-packages

# Run all release gates without publishing
pnpm release:config
pnpm release:check
```

`pnpm release` runs the complete release check and then publishes through
Changesets. It is intended for the trusted GitHub Actions workflow. Do not run
it locally during ordinary development.

Because changelog entries are enriched from GitHub, applying versions to
committed changesets outside Actions requires a read-capable `GITHUB_TOKEN`.
Ordinary contributors do not need a token: they only create and commit
changesets. The release workflow supplies its short-lived GitHub token
automatically.

## Release checks

`pnpm release:check` runs the following gates for all published packages:

1. Workspace privacy, package identity, repository metadata, included files,
   entry points, build commands, and Changesets policy.
2. Builds, including generated CLI templates and browser bundle assets.
3. Tests.
4. Type checking, including the Svelte and Vue package-specific checks.
5. Lint and formatting checks.
6. `publint`.
7. `attw` for packages with Node-compatible TypeScript declaration entry
   points. Svelte and Vue use framework-specific declaration imports, so their
   compiler checks and `publint` are authoritative instead.
8. Creation and inspection of every package archive.

Archive inspection verifies package identity, eliminates unresolved
`workspace:` ranges, checks literal export targets, and asserts that the CLI
templates and browser bundle artifacts are present.

Publishing is wired to `pnpm release`, so it cannot run without these checks
passing.

## Automated release flow

The workflow at `.github/workflows/publish-npm-package.yml` deliberately keeps
the historical filename because npm trusted-publisher configuration may refer
to it.

On each push to `main`, `changesets/action` does one of two things:

- If unreleased changesets exist, it creates or updates one rolling
  `chore(release): version packages` pull request. That pull request updates
  package versions, per-package changelogs, internal dependency ranges, and the
  pnpm lockfile, and removes consumed changeset files.
- After that generated pull request is merged, it runs `pnpm release`, publishes
  the changed packages with npm trusted publishing, pushes package-specific Git
  tags, and creates GitHub Releases.

The workflow uses GitHub OIDC and does not use a long-lived npm publishing
token. Its concurrency group prevents overlapping release runs.

## Package audit and internal ranges

The release-management migration audited the nine public packages against the
npm registry. Their local names and versions matched the published versions at
the time of migration. Each package points to `thesysdev/openui` with the
correct package directory, includes its build output in `files`, and has a build
step. Literal `exports`, entry points, and bins are checked from the packed
archives on every release.

The scoped-package access setting is centralized in
`.changeset/config.json`; individual packages do not need duplicate
`publishConfig.access` fields.

Public package relationships use `workspace:^` except for
`@openuidev/react-email`, whose peer dependency on
`@openuidev/react-lang` is `workspace:*`. pnpm publishes `workspace:*` as an
exact version, which can constrain consumers more tightly than the other
packages. That range is documented here for maintainers to revisit, but it is
left unchanged because the repository does not establish whether exact
coupling is intentional. `workspace:*` ranges in private examples are local
workspace links and are never published.

The CLI is intentionally a bin-only package and has no `exports` map. The
browser bundle intentionally publishes JavaScript and CSS without TypeScript
declarations.

`examples/harnesses/vercel-eve` is an example application and is explicitly
private so it cannot be selected or published by Changesets.

## Owner-only setup and operation

Before enabling publishing, the repository owner should:

1. Review the first generated release pull request.
2. Confirm npm trusted publishing for all nine packages references
   `thesysdev/openui` and the workflow filename
   `publish-npm-package.yml`, with `npm publish` allowed.
3. Apply branch protection and any desired GitHub environment approval.
4. Confirm Actions may create pull requests in repository settings.
5. Audit commits made since each package's last manual release and add
   migration changesets for any consumer-facing work that is not yet published.

Do not manually edit or merge generated release artifacts without reviewing the
calculated package set. npm publishing, Git tags, GitHub Releases, and remote
settings remain owner-controlled operations.
