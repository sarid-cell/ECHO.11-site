#!/usr/bin/env python3
"""Sync the homepage Field Notes cards with the latest Substack posts.

Runs daily in GitHub Actions (.github/workflows/field-notes.yml).
Reads the Substack RSS feed, takes the 3 newest posts, saves each cover
as a small WebP in assets/images/notes/, and rewrites only the block
between the FIELD-NOTES markers in index.html. If nothing changed,
the file is left untouched, so no commit and no deploy happen.

Local test:  python3 tools/update_field_notes.py --feed path/to/feed.xml
"""
import argparse, html, io, json, os, re, sys, urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FEED_URL = "https://shirasarid.substack.com/feed"
INDEX = os.path.join(ROOT, "index.html")
OVERRIDES = os.path.join(ROOT, "tools", "field-notes-overrides.json")
IMG_DIR = "assets/images/notes"
FALLBACK_IMG = {"image": "assets/images/future-astro-man.webp", "width": 1456, "height": 816}
MAX_POSTS = 3
MAX_BYTES = 150 * 1024          # CLAUDE.md: no image over 150KB
MAX_WIDTH = 1200
START = "<!-- FIELD-NOTES:START (auto-updated from Substack by tools/update_field_notes.py; edit tools/field-notes-overrides.json, not this block) -->"
END = "<!-- FIELD-NOTES:END -->"
UA = {"User-Agent": "echo11-field-notes/1.0 (+https://echo11.app)"}


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def parse_feed(xml_bytes):
    root = ET.fromstring(xml_bytes)
    posts = []
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if not title or "/p/" not in link:
            continue  # skip podcasts/notes without a post page
        enc = item.find("enclosure")
        posts.append({
            "title": title,
            "subtitle": (item.findtext("description") or "").strip(),
            "url": link.split("?")[0],
            "slug": link.split("/p/")[1].split("?")[0].strip("/"),
            "cover": enc.get("url") if enc is not None and (enc.get("type") or "").startswith("image") else None,
        })
    return posts[:MAX_POSTS]


def override_for(title, overrides):
    t = title.lower()
    for o in overrides:
        if o["match"].lower() in t:
            return o
    return {}


def short_title(title):
    head = re.split(r"[:?.!]", title, maxsplit=1)[0].strip()
    words = head.split()
    return " ".join(words[:6]) if len(words) > 6 else head


def save_cover(post):
    """Download the cover once and store it as WebP under 150KB."""
    from PIL import Image  # only needed when a new cover arrives
    rel = f"{IMG_DIR}/{re.sub(r'[^a-z0-9-]', '', post['slug'].lower())[:80]}.webp"
    path = os.path.join(ROOT, rel)
    if os.path.exists(path):
        with Image.open(path) as im:
            return rel, im.size
    im = Image.open(io.BytesIO(fetch(post["cover"]))).convert("RGB")
    if im.width > MAX_WIDTH:
        im = im.resize((MAX_WIDTH, round(im.height * MAX_WIDTH / im.width)), Image.LANCZOS)
    for q in (80, 72, 64, 56, 48, 40):
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= MAX_BYTES:
            break
    else:
        raise SystemExit(f"Cover for {post['slug']} is still over 150KB")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(buf.getvalue())
    return rel, im.size


def card(post, i, overrides):
    o = override_for(post["title"], overrides)
    url = o.get("url", post["url"])
    if o.get("image"):
        img, (w, h) = o["image"], (o["width"], o["height"])
    elif post["cover"]:
        img, (w, h) = save_cover(post)
    else:
        img, w, h = FALLBACK_IMG["image"], FALLBACK_IMG["width"], FALLBACK_IMG["height"]
    alt = o.get("alt", "")   # auto covers are decorative: the title sits right beside them
    style = f' style="object-position: {o["position"]}"' if o.get("position") else ""
    cls = ["article-card", "featured" if i == 0 else "reverse" if i == 2 else "", "reveal"]
    e = lambda s: html.escape(s, quote=False).replace('"', "&quot;")
    badge = '                            <span class="article-badge">Latest</span>\n' if i == 0 else ""
    sub = f'                            <p class="subtitle">{e(post["subtitle"])}</p>\n' if post["subtitle"] else ""
    return (
        f'                    <article class="{" ".join(c for c in cls if c)}">\n'
        f'                        <div class="article-content">\n'
        f'{badge}'
        f'                            <h3>{e(post["title"])}</h3>\n'
        f'{sub}'
        f'                            <a href="{e(url)}" target="_blank" rel="noopener noreferrer" class="read-more">Read: {e(o.get("short") or short_title(post["title"]))}</a>\n'
        f'                        </div>\n'
        f'                        <div class="article-image">\n'
        f'                            <img src="{e(img)}" alt="{e(alt)}" loading="lazy" width="{w}" height="{h}"{style}>\n'
        f'                        </div>\n'
        f'                    </article>\n'
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--feed", help="read the feed from a local file instead of Substack")
    args = ap.parse_args()

    xml_bytes = open(args.feed, "rb").read() if args.feed else fetch(FEED_URL)
    posts = parse_feed(xml_bytes)
    if not posts:
        sys.exit("No posts found in the feed; leaving the homepage as it is.")

    overrides = json.load(open(OVERRIDES, encoding="utf-8"))["posts"]
    block = START + "\n" + "\n".join(card(p, i, overrides) for i, p in enumerate(posts)) + "                    " + END

    page = open(INDEX, encoding="utf-8").read()
    if page.count(START) != 1 or page.count(END) != 1:
        sys.exit("FIELD-NOTES markers missing in index.html; not touching the page.")
    new = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda _: block, page, flags=re.S)
    if new == page:
        print("Field Notes already up to date.")
        return
    open(INDEX, "w", encoding="utf-8").write(new)
    print("Field Notes updated: " + " | ".join(p["title"] for p in posts))


if __name__ == "__main__":
    main()
