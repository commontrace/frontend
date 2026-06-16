"""Build-check tests for the global savings counter (frontend).

Run from the repo root with the build venv:
    /tmp/ctfe-venv/bin/python tests/test_savings_counter.py

No pytest: this is a plain assertion script, matching the repo's
build-check CI (python build.py + test -f _site/index.html).
"""

import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TRANSLATIONS = REPO / "translations.json"
SITE = REPO / "_site"

SUPPORTED_LANGS = ["en", "fr", "zh", "es", "pt", "de", "ja", "ar", "hi"]
SAVINGS_KEYS = [
    "home.savings_eyebrow",
    "home.savings_hours",
    "home.savings_money",
    "home.savings_joiner",
    "home.savings_suffix",
]

failures = []

def check(cond, msg):
    if not cond:
        failures.append(msg)

def test_i18n_keys_present_all_langs():
    data = json.loads(TRANSLATIONS.read_text())
    for lang in SUPPORTED_LANGS:
        block = data.get(lang)
        check(block is not None, f"[i18n] language block missing: {lang}")
        if block is None:
            continue
        for key in SAVINGS_KEYS:
            check(
                key in block and isinstance(block[key], str) and block[key].strip() != "",
                f"[i18n] {lang} missing non-empty key: {key}",
            )
        # Placeholders must survive in the clause keys.
        check("{hours}" in block.get("home.savings_hours", ""),
              f"[i18n] {lang} home.savings_hours missing {{hours}} placeholder")
        check("{dollars}" in block.get("home.savings_money", ""),
              f"[i18n] {lang} home.savings_money missing {{dollars}} placeholder")

def test_build_runs_clean():
    proc = subprocess.run(
        [sys.executable, "build.py"],
        cwd=str(REPO),
        capture_output=True,
        text=True,
    )
    check(proc.returncode == 0, f"[build] build.py exited {proc.returncode}: {proc.stderr[-500:]}")
    check((SITE / "index.html").exists(), "[build] _site/index.html not generated")

def test_counter_markup_in_generated_html():
    en = (SITE / "index.html").read_text()
    fr = (SITE / "fr" / "index.html").read_text()
    for label, html in (("en", en), ("fr", fr)):
        check('id="savings-counter"' in html,
              f"[markup:{label}] #savings-counter element missing")
        check('class="savings-counter"' in html,
              f"[markup:{label}] .savings-counter class missing")
        check('hidden' in html.split('id="savings-counter"', 1)[1][:200],
              f"[markup:{label}] counter not hidden-by-default")
        check('data-hours-template=' in html,
              f"[markup:{label}] data-hours-template attr missing")
        check('data-money-template=' in html,
              f"[markup:{label}] data-money-template attr missing")
        check('data-joiner=' in html,
              f"[markup:{label}] data-joiner attr missing")
        check('data-suffix=' in html,
              f"[markup:{label}] data-suffix attr missing")
        check('savings-counter.js' in html,
              f"[markup:{label}] savings-counter.js script tag missing")
    # FR must carry the French clause, proving i18n flows into markup.
    check("heures" in fr or "heure" in fr,
          "[markup:fr] French hours clause not found in data attributes")

def test_js_asset_copied():
    check((SITE / "static" / "savings-counter.js").exists(),
          "[asset] _site/static/savings-counter.js not copied by build")

def main():
    test_i18n_keys_present_all_langs()
    test_build_runs_clean()
    test_counter_markup_in_generated_html()
    test_js_asset_copied()
    if failures:
        print("FAIL")
        for f in failures:
            print("  -", f)
        sys.exit(1)
    print("PASS: savings counter build-checks green")

if __name__ == "__main__":
    main()
