# Contributing to yzdatabase

Thanks for helping keep this catalog useful and accurate.

## Add or update a tool

1. Open `scripts/build.js`.
2. Add a line to the `CANDIDATES` array: `["<category>", "owner/repo", "short use phrase"]`.
   - `<category>` must be one of the keys in `CATEGORY_META`.
   - Keep the use phrase short and task-oriented ("what job is this for").
3. Re-run `node scripts/build.js` (needs an authenticated `gh` CLI). This refetches stars/description and regenerates `index.json`, the `skills/` files and the README table.
4. Open a pull request.

## Inclusion criteria

- **Open source** with a real, resolvable GitHub repo.
- **Proven**: meaningful adoption (stars), recent activity, and relevance to building/running AI agents.
- No dead or archived-and-abandoned projects.

## Adding a category

Add an entry to `CATEGORY_META` in `scripts/build.js` (with `title`, Turkish `tr` description, and `when_to_use`), then categorize entries into it.
