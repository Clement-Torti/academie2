#!/usr/bin/env python3
"""Génère articles-local.js — aperçu d'articles pas encore poussés.

    python3 make-local.py mon-article-1 mon-article-2   # embarque ces articles
    python3 make-local.py                               # vide l'aperçu

Ouvert en file:// (double-clic sur index.html), le navigateur interdit de lire
les JSON du disque : les pages retombent sur GitHub Pages, où un article tout
neuf n'existe pas encore. Un <script src>, lui, se charge sans restriction :
c'est par là que passent les articles listés ici.
"""
import json, sys, pathlib

ROOT = pathlib.Path(__file__).parent
ids = sys.argv[1:]

articles = []
for i in ids:
    f = ROOT / 'articles' / f'{i}.json'
    if not f.exists():
        sys.exit(f'introuvable : {f}')
    articles.append(json.loads(f.read_text(encoding='utf-8')))

header = f"""/* ═══════════════════════════════════════════════════════════════
   APERÇU LOCAL — articles pas encore poussés sur GitHub Pages
   ───────────────────────────────────────────────────────────────
   Fichier GÉNÉRÉ, ne pas modifier à la main :

       python3 make-local.py {' '.join(ids) if ids else '<id-article>'}

   En file://, le navigateur refuse de lire articles/*.json ; les
   pages retombent donc sur GitHub Pages. Les articles embarqués
   ici passent par un <script>, donc restent visibles en local.

   Une fois l'article poussé, vider l'aperçu :
       python3 make-local.py
   ═══════════════════════════════════════════════════════════════ */
"""

body = json.dumps({'articles': articles}, ensure_ascii=False, indent=2)
(ROOT / 'articles-local.js').write_text(
    f'{header}window.ACAD2_LOCAL = {body};\n', encoding='utf-8')

print(f"articles-local.js : {len(articles)} article(s) embarqué(s)"
      + (f" — {', '.join(ids)}" if ids else " (aperçu vide)"))
