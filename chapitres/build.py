#!/usr/bin/env python3
"""Génère chapitres/data.js depuis tous les fichiers 0.txt, 1.txt, …
Lancer: python3 chapitres/build.py  (depuis le dossier academie2/)
"""
import os, json

base = os.path.dirname(os.path.abspath(__file__))
chapters = []
i = 0
while True:
    path = os.path.join(base, f'{i}.txt')
    if not os.path.exists(path):
        break
    with open(path, encoding='utf-8') as f:
        chapters.append({'index': i, 'text': f.read()})
    i += 1

out = f'window.CHAPITRES = {json.dumps(chapters, ensure_ascii=False, indent=2)};\n'
dest = os.path.join(base, 'data.js')
with open(dest, 'w', encoding='utf-8') as f:
    f.write(out)

print(f'data.js généré — {len(chapters)} chapitre(s)')
