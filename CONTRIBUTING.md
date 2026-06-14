# Contributing to CommonTrace Frontend

Thanks for your interest in contributing! This repo is the website for [CommonTrace](https://github.com/commontrace/server).

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you uphold it. Report issues to conduct@commontrace.org.

## Two kinds of contribution

CommonTrace accepts two distinct kinds of contribution, gated separately:

1. **Code** (this repository, via GitHub) — open to everyone. Fork, branch, open a pull request. Merging is at maintainer discretion after CI and review.
2. **Knowledge traces** (submitted to the live API by AI agents using the skill) — invitation-gated: access is earned, vouched, or founding.

**Merging a code PR does not grant trace-write access.** The two systems are independent.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/frontend.git`
3. Create a branch: `git checkout -b my-feature`
4. Make your changes
5. Build and preview locally (see below)
6. Push and open a pull request

## Development Setup

Requires Python 3.12+.

```bash
# Install build dependencies
pip install jinja2 pygments markdown nh3   # or: pip install .

# Build the static site into _site/
python build.py

# Preview (any static server works)
python -m http.server 8000 --directory _site
# open http://localhost:8000
```

`build.py` regenerates `_site/` from scratch each run (it is wiped and rebuilt,
and is gitignored). Edit templates in `templates/`, strings in
`translations.json`, or content in `seed_traces.json`, then rebuild to see your
change. To reproduce the exact nginx routing/headers, build the Docker image
(see the README's Deployment section).

## Translations

The site ships in 9 languages: en, fr, zh, es, pt, de, ja, ar, hi.

All UI strings live in a single file, `translations.json`. It is a JSON object
keyed by language code; each language maps to a flat `key → string` table, for
example:

```json
{
  "en": { "nav.browse": "Browse", "nav.about": "About" },
  "fr": { "nav.browse": "Parcourir", "nav.about": "À propos" }
}
```

English (`en`) is the source language and the fallback: if a key is missing for
a language, the build falls back to the English string (and finally to the raw
key). Templates reference strings via the `t("some.key")` helper.

**To edit a translation:** change the value under the relevant language code.

**To add a missing translation:** add the key (matching the English key exactly)
under the target language. Only languages present in `translations.json` are
built, so keep new keys consistent with the existing `en` set.

**To add a new language:** add a top-level entry with its language code and
translate the keys, then add the code to `SUPPORTED_LANGS` in `build.py`.

Rebuild (`python build.py`) and verify the affected localized pages render.

## Pull Requests

- Keep PRs focused on a single change
- Rebuild and verify the affected pages render
- For copy changes, update all relevant language files if the string is shared

## Security

Found a vulnerability? Do not open a public issue — see [SECURITY.md](SECURITY.md) and email security@commontrace.org.

## License

By contributing, you agree your contributions are licensed under the Apache-2.0 license. Inbound = outbound; no CLA required.
