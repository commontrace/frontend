# CommonTrace Frontend

The website for [CommonTrace](https://github.com/commontrace/server) — a Jinja2-templated static site that serves commontrace.org and docs.commontrace.org.

## Stack

- Python build script (`build.py`) renders Jinja2 templates to static HTML
- nginx (Alpine) serves both domains via `server_name` routing
- 9 languages: en, fr, zh, es, pt, de, ja, ar, hi

## Build

Requires Python 3.12+. Install the build dependencies and run the generator:

```bash
pip install jinja2 pygments markdown nh3   # or: pip install .
python build.py
```

`build.py` reads `seed_traces.json` and `translations.json`, renders the
templates in `templates/`, and writes the complete static site to `_site/`
(the output directory is wiped and regenerated on every build, and is
gitignored). Per trace it generates an individual page, tag index pages, a
browsable index, and localized variants for every language present in
`translations.json`. English renders at the root; other languages render under
`/{lang}/` (e.g. `/fr/`, `/zh/`).

Optional environment variables (web-analytics injection, all default to empty):
`ANALYTICS_DOMAIN`, `ANALYTICS_SCRIPT_URL`, `ANALYTICS_SHARE_URL`.

## Local preview

The build output is plain static HTML, so any static file server works. Serve
the `_site/` directory:

```bash
python -m http.server 8000 --directory _site
# then open http://localhost:8000
```

To reproduce the production nginx behavior exactly (clean URLs, `server_name`
routing, security headers, the docs subdomain), build and run the Docker image
instead — see [Deployment](#deployment).

## Project layout

| Path | What it is |
|------|------------|
| `build.py` | Static-site generator (Jinja2 → `_site/`) |
| `templates/` | Jinja2 templates (`base.html`, `home.html`, `trace.html`, `tag.html`, `docs.html`, …) |
| `static/` | Shared assets — logos, favicons, `search.js`, `hero-animation.js` (copied into `_site/static/`) |
| `translations.json` | All UI strings, keyed by language code (see CONTRIBUTING) |
| `seed_traces.json` | Trace content rendered into pages |
| `nginx.conf` | Main-site nginx config (`commontrace.org`) |
| `nginx-docs.conf` | Docs-subdomain nginx config (`docs.commontrace.org`) |
| `Dockerfile` | Builds + serves the main site |
| `Dockerfile.docs` | Builds + serves the docs subdomain at root |
| `railway.toml` | Railway build config (points at `Dockerfile`) |
| `pyproject.toml` | Build dependencies / packaging metadata |
| `_site/` | Build output (generated, gitignored) |

## Deployment

Pushed to the `commontrace/frontend` repo; Railway auto-deploys via the Dockerfile.

The build is a two-stage Docker image: stage one runs `build.py` on
`python:3.12-slim`; stage two copies `_site/` into `nginx:alpine` and renders
the nginx config with `envsubst` (`$PORT`). The main site uses `Dockerfile` +
`nginx.conf`; the docs subdomain uses `Dockerfile.docs` + `nginx-docs.conf`,
which serves `_site/docs/` at the root and 301-redirects site paths back to the
apex domain.

## License

Apache-2.0 — see LICENSE.
