# Changesets

Changeset files record the consumer-facing package changes that have not been
released yet. Do not edit generated package versions or changelogs directly.

Run `pnpm changeset` from the repository root, select every affected published
package, choose the appropriate SemVer bump, and write a concise summary of the
impact on package consumers. Commit the generated Markdown file with the code
that it describes.

For a change under `packages/` that intentionally does not require any package
release, run:

```sh
pnpm changeset --empty
```

Commit that empty changeset with the change. Use an empty changeset only when
the entire pull request has no consumer-facing package impact; do not combine
it with release entries in the same pull request.

See [`RELEASING.md`](../RELEASING.md) for the versioning policy, package
coupling rules, validation, and maintainer release process.
