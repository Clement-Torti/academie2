# Académie 2 — Plan de Développement

> Fichier de référence du projet. Maintenir à jour au fil du développement.

---

## Vision

Application web de pratique quotidienne du français, 100 % HTML/CSS/JS, données
dans `localStorage`. Couleurs de l'Académie v1 (`frBlue #002654`, `frRed #ED2939`,
`frCream #F5F5DC`, `gold #D4AF37`).

**La leçon est tournée vers la PRODUCTION, pas la consommation.** L'étudiante ne
doit pas seulement lire et écouter : elle doit écrire et parler. D'où l'ordre :

```
1. ARTICLE   (lecture)   — B2, 200-250 mots. Donne le sujet et le vocabulaire.
2. DICTÉE    (écriture)  — 15-20 min, correction par IA, mise à jour du carnet.
3. ORAL      (parole)    — 20 min et plus avec un natif, erreurs notées en direct.
```

Le fil rouge des deux exercices de production est le **carnet d'erreurs** : c'est
lui qui transforme une correction ponctuelle en progression visible.

---

## Architecture des fichiers

```
academie2/
├── index.html        ← Accueil : timeline, articles, statistiques, réglages
├── article.html      ← Leçon : article + dictée (étapes 1 à 6)
├── oral.html         ← Expression orale : sujets, chrono, notation, carnet
├── carnet.html       ← Carnet d'erreurs : progression, points, sauvegarde
├── carnet.js         ← Module partagé : carnet + relais IA (Carnet, AIRelay)
├── translation.html  ← Ancienne phase de traductions (plus dans le parcours)
├── make-local.py     ← [temporaire] embarque un article pas encore poussé
├── articles-local.js ← [temporaire] généré : aperçu local en file://
├── prompt.txt        ← Prompt de génération d'un article JSON
├── contexte.txt      ← Fiche personnage (Rosalía) pour les contenus
├── catalog.json      ← Index des articles
└── articles/*.json   ← Un fichier par article
```

---

## 1. Accueil (`index.html`)

- Navbar : streak, **carnet**, expression orale (alerte rouge si pas faite
  aujourd'hui), réglages
- Timeline horizontale des jours (complété / aujourd'hui / manqué / futur)
- Grille des articles non lus → ouvre la leçon
- Statistiques : sessions, racha, dictées corrigées, points maîtrisés
- Courbe : score de dictée sur 100
- Modal réglages : clés Gemini, vocabulaire (export/import), paramètres

---

## 2. Leçon (`article.html`)

### 2.1 Lecture
Hero, vocabulaire cliquable (TTS), article, réactions de lecteurs.

### 2.2 Dictée — 15 à 20 minutes, correction comprise

| Étape | Écran | Détail |
|-------|-------|--------|
| 0 | Présentation | mots, unités, durée, points du carnet à surveiller |
| 1 | Première écoute | texte lu **une fois** à 0.9×, aucun texte affiché |
| 2 | Dictée | unités de 5 à 10 mots, 0.7× (réglable), ponctuation annoncée (par défaut), répétition libre, clic pour l'unité suivante |
| 3 | Relais IA | prompt prérempli dans Claude : texte original + sa copie + son carnet |
| 4 | Analyse | une erreur à la fois : indice → correction → règle → statut carnet |
| 5 | Bilan | score, diff mot à mot, **changements du carnet** |
| 6 | Relecture | texte correct relu à 0.9×, phrase surlignée — **obligatoire** : c'est elle qui débloque l'oral |

Détails d'implémentation :
- Le texte vient de `dictation.text` (+ `dictation.units` si fourni).
  À défaut, un extrait de l'article est choisi automatiquement : phrases
  entières, 85-125 mots, en préférant le passage qui contient le moins de
  chiffres et de symboles (indevinables à l'oreille).
- Découpage automatique : coupe sur la ponctuation, sinon devant un mot qui
  ouvre un groupe ; jamais moins de 3 ni plus de 10 mots par unité.
- **L'article et le vocabulaire sont floutés** pendant toute la dictée.
- Brouillon sauvegardé (`acad2_dictee_draft_{id}`) : un rechargement propose
  de reprendre là où elle en était.
- Le carnet est écrit dès que la correction est appliquée, avant la revue :
  si elle s'interrompt, rien n'est perdu.
- La journée est marquée complétée au bilan de la dictée.

### 2.3 Sortie
Bouton vers `oral.html?id={article}`, débloqué seulement quand la relecture
finale est allée au bout (garde-fou de temps si la synthèse vocale ne rend
jamais la main). Le lien « Voir tout mon carnet » du bilan s'ouvre dans un
nouvel onglet : la leçon en cours n'est jamais perdue.

---

## 3. Expression orale (`oral.html`)

Objectif affiché : **tenir plus de 20 minutes**.

- **Sujets** : `oralTopics` de l'article (titre + question d'ouverture +
  4 relances). Sans article, ou si le champ manque, cinq sujets de repli sont
  construits à partir du titre (restitution, avis, vécu, comparaison RD/France,
  projection à Strasbourg).
- **Chrono** : play / pause / terminer, barre d'objectif 20 min, temps restant
  puis dépassement.
- **Aide-mémoire pendant la conversation** : relances cliquables (barrées quand
  utilisées) et vocabulaire de l'article à lui faire placer.
- **Notation en direct** (c'est le natif qui note) : « ce qu'elle a dit » +
  « ce qu'il fallait dire » + catégorie en un clic, `Entrée` pour ajouter,
  horodatage automatique. On classe grossièrement, on affine à la fin.
- **Revue** : chaque erreur est corrigée, catégorisée, et rattachée à un point
  existant du carnet ou à un nouveau point.
- **Notes** : les trois critères d'origine (attitude, résilience, fluidité).
- Puis changements du carnet, courbe et historique (avec durée, objectif
  atteint, nombre d'erreurs).

---

## 4. Carnet d'erreurs (`carnet.js` + `carnet.html`)

Le carnet ne stocke pas des erreurs isolées mais des **points** de langue
(« accord du participe passé avec être »). Chaque erreur nourrit un point
existant ou en crée un.

- 23 catégories préfaites (non exhaustives), chacune valable à l'écrit,
  à l'oral, ou aux deux. Une faute de prononciation ne peut donc pas être
  « révisée » par une dictée.
- Cycle de vie : `active` → `improving` → `mastered` après
  `CLEAN_TARGET = 3` séances testables sans récidive. Un point réussi alors
  qu'il était en jeu (`confirmed`) avance deux fois plus vite. Une récidive
  ramène le point en `active` et est comptée.
- Changelog après chaque exercice : points corrigés, nouveaux, répétés,
  récidives — identique dans la dictée et dans l'oral.
- `carnet.html` : compteurs, courbe (erreurs par séance vs points maîtrisés
  cumulés), répartition par catégorie, liste filtrable, jauge de séances
  propres, export/import/effacement.

Stockage `acad2_carnet` :
```js
{
  version: 1,
  points: [{ id, category, label, es, occurrences, cleanStreak, relapses,
             status, firstSeen, lastSeen, masteredAt,
             examples: [{ wrong, right, note, at, source, articleId }] }],
  sessions: [{ id, at, type, articleId, errorCount,
               newIds, repeatedIds, masteredIds, relapseIds }]
}
```

---

## 5. Correction par IA — mode relais manuel

Aucune clé API n'est nécessaire : `AIRelay` ouvre `claude.ai/new?q=…` avec le
prompt prérempli (et le copie dans le presse-papiers), l'utilisatrice colle la
réponse JSON. Garde-fous à la relecture de cette réponse :
- le fragment fautif doit se retrouver dans son texte (sinon l'erreur est
  écartée) — sauf pour un mot oublié, qui n'a pas de fragment ;
- les erreurs sont réordonnées selon leur position dans son texte ;
- le carnet est retrouvé par identifiant, sinon par libellé approchant.

Le prompt de dictée contient le texte original, sa copie, et son carnet
(identifiants inclus) ; il demande aussi les points du carnet **réussis** cette
fois-ci (`resolved`).

---

## 6. LocalStorage — schéma complet

| Clé | Description | Partagée v1 |
|-----|-------------|-------------|
| `acad_user_vocab` | `[{fr, es}]` — vocabulaire | ✅ |
| `acad_gemini_keys` | `[string]` — clés API | ✅ |
| `acad2_carnet` | carnet d'erreurs (points + séances) | non |
| `acad2_oral` | sessions d'expression orale | non |
| `acad2_stats` | sessions, streak, scores de dictée | non |
| `acad2_days` | `{[date]: {status, articleId}}` | non |
| `acad2_read_ids` | articles déjà faits | non |
| `acad2_dictee_draft_{id}` | brouillon de dictée en cours | non |
| `acad2_config` | `{wordsPerDay, newSentencesPerDay}` | non |

---

## 7. Aperçu local d'un article non poussé

Ouvert par double-clic (`file://`), le navigateur refuse de lire `catalog.json`
et `articles/*.json` du disque : les pages retombent alors sur GitHub Pages, où
un article tout neuf n'existe pas encore. Un `<script src>` échappe à cette
restriction, d'où le contournement :

```bash
python3 make-local.py mon-nouvel-article   # génère articles-local.js
python3 make-local.py                      # vide l'aperçu, une fois poussé
```

`index.html` place ces articles en tête du catalogue (badge rouge « local ») et
reste utilisable même si GitHub est injoignable ; `article.html` et `oral.html`
les servent avant toute requête réseau. Sans le fichier, ou avec un aperçu
vide, tout revient au comportement normal.

---

## 8. Dépendances CDN

Tailwind, Google Fonts (Merriweather / Montserrat / Nunito), Font Awesome,
Chart.js. `carnet.js` est un simple `<script src>` local : tout fonctionne
aussi en `file://` (les `fetch` d'articles retombent alors sur GitHub Pages).

---

## 9. Points d'attention

- Ne jamais couper une unité de dictée au milieu d'un groupe indissociable.
- L'article reste flouté tant que la dictée n'est pas terminée.
- Le carnet est la seule source de vérité de la progression : toute nouvelle
  correction doit passer par `Carnet.record()`.
- Un point d'oral ne progresse que par des sessions orales, et inversement.
- La synthèse vocale ne prononce pas la ponctuation : elle n'est corrigée que
  si l'option « Ponctuation » a été activée pendant la dictée.
- Les chiffres et symboles ne sont pas devinables à l'oreille : le prompt
  demande de ne pas les compter comme fautes quand le texte en contient.
