#!/usr/bin/env python3
"""Inline the three small render-blocking stylesheets into every page.

fonts.css, view-transitions.css and quiet-mode.css are tiny (about 10 KB
together) but each one was a separate blocking request before first paint.
Inlining them took first paint on the 10 Hz page from ~1.4 s to ~1.0 s in
Lighthouse (mobile).

The files in assets/css/ stay the single source of truth:
  1. edit assets/css/<name>.css
  2. run:  python3 tools/inline_css.py
Each page holds a <style data-inline="<name>.css"> block that this script
rewrites; on a page that still links the file, the <link> is replaced.
Safe to run any number of times. tools/ is not deployed (.vercelignore).
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
NAMES = ["fonts.css", "view-transitions.css", "quiet-mode.css"]


def css_for(name):
    css = (ROOT / "assets" / "css" / name).read_text(encoding="utf-8")
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)           # drop comments
    css = css.replace("url(../fonts/", "url(/assets/fonts/")  # paths from the page, not /assets/css/
    css = "\n".join(line.rstrip() for line in css.splitlines() if line.strip())
    return css


def main():
    blocks = {n: f'<style data-inline="{n}">\n{css_for(n)}\n</style>' for n in NAMES}
    changed = 0
    for page in sorted(ROOT.rglob("*.html")):
        if any(part in ("tools", "node_modules", ".git") for part in page.parts):
            continue
        html = page.read_text(encoding="utf-8")
        new = html
        for n, block in blocks.items():
            link = re.compile(r'<link rel="stylesheet" href="/?assets/css/' + re.escape(n) + r'">')
            inline = re.compile(r'<style data-inline="' + re.escape(n) + r'">.*?</style>', re.S)
            if inline.search(new):
                new = inline.sub(lambda m: block, new, count=1)
            else:
                new = link.sub(lambda m: block, new, count=1)
        if new != html:
            page.write_text(new, encoding="utf-8")
            changed += 1
    print(f"updated {changed} page(s)")


if __name__ == "__main__":
    main()
