# Académie 2 — Plan de Développement

> Fichier de référence du projet. Maintenir à jour au fil du développement.

---

## Vision

Application web de pratique quotidienne du français (lecture + traductions orales), 100% HTML/CSS/JS, données dans `localStorage`. Inspirée visuellement de l'Académie v1 (couleurs `frBlue #002654`, `frRed #ED2939`, `frCream #F5F5DC`, `gold #D4AF37`). Thème sombre pour le lecteur.

---

## Architecture des fichiers

```
academie2/
├── index.html          ← Homepage + timeline + statistiques + config
├── reader.html         ← Lecteur immersif type Kindle (dark)
├── translation.html    ← Phase de traductions orales
├── PLAN.md             ← Ce fichier
└── (assets si besoin)
```

---

## 1. Homepage (`index.html`)

### 1.1 Navbar
Identique à `academie/index.html` :
- Logo `fa-landmark` + titre "L'Académie 2"
- Compteur de streak (flamme)
- Bouton Paramètres (icône clé/engrenage) → ouvre la modal de config

### 1.2 Timeline horizontale
- Ligne droite horizontale (pas verticale ni courbée), scrollable horizontalement
- Un checkpoint/bouton circulaire par jour (Jour 1, Jour 2, …)
- **État des checkpoints :**
  - Complété → couleur gold/vert + icône check
  - Aujourd'hui (prochain à faire) → couleur `frBlue`, pulsant, agrandi
  - Futur → gris, désactivé visuellement
- Clic sur le bouton du jour actif → démarre la pratique du jour (ouvre `reader.html`)
- La timeline se positionne automatiquement sur le checkpoint du jour courant (scroll horizontal auto)

### 1.3 Bloc Statistiques
Six widgets en grille (2×3 sur mobile, 3×2 sur desktop) :

| Widget | Donnée |
|--------|--------|
| Pratiques complétées | Nombre total de sessions terminées |
| Racha de jours | Streak actuel + record |
| Vitesse de lecture | Chart linéaire : mots/min par session |
| Temps total de lecture | En minutes/heures |
| Vitesse de traduction | Chart linéaire : secondes/phrase par session |
| Phrases traduites | Nombre total |

**Charts :** utiliser Chart.js (CDN). Thème cohérent avec les couleurs du projet.

**Données stockées dans `localStorage` :**
```js
acad2_stats: {
  sessions: [
    {
      date: "2026-05-24",
      readingWords: 320,
      readingDurationMs: 480000,   // → 66 mots/min
      translationSentences: 10,
      translationTimes: [12, 8, 15, ...], // secondes par phrase
    },
    ...
  ],
  streak: 5,
  lastCompletedDate: "2026-05-23"
}
```

### 1.4 Modal de Configuration
Accessible depuis la navbar. Sections :

#### A. Vocabulaire
- Bouton **Exporter JSON** → télécharge le vocabulaire de `acad_user_vocab` (même clé que l'Académie v1 pour compatibilité)
- Bouton **Importer JSON** → `<input type="file">` → parse et fusionne dans `localStorage`

#### B. Clés API Gemini
- Liste des clés existantes (masquées, bouton suppression)
- Champ pour ajouter une nouvelle clé
- Rotation automatique en cas d'erreur 429/403 (même logique que v1)
- Clés stockées dans `acad_gemini_keys` (compatible v1)

#### C. Paramètres de pratique
- **Mots à lire par jour** : input numérique (défaut : 300)
- **Phrases à générer pour les traductions** : input numérique (défaut : 10)
- Stocké dans `acad2_config : { wordsPerDay, sentencesPerSession }`

---

## 2. Lecteur (`reader.html`)

### 2.1 Style & ambiance
- **Thème dark immersif** : fond `#1a1a2e` ou `#0d0d1a`, texte `#e8e0d4` (ivoire chaud)
- Police de lecture : `Merriweather` serif pour le corps, `Montserrat` pour l'UI
- Inspiration esthétique : *Sombra y Hueso* / roman de fantasy jeune adulte
- Pas de distractions : navbar minimaliste, marges généreuses, interlignes confortables

### 2.2 Contenu du livre
- Le contenu du livre est fourni en **Markdown hardcodé** dans un script JS (ou dans un `<script type="text/plain">`)
- Parsing du Markdown → HTML minimal (titres, paragraphes, italiques, gras)
- Structure interne : tableau de phrases (`sentences[]`), chaque phrase ayant un index

### 2.3 Logique de chargement quotidien
1. Charger la config `wordsPerDay` (défaut 300)
2. Récupérer la position sauvegardée : `acad2_reader_progress.sentenceIndex`
3. **Contexte de rappel** : afficher les 3–5 dernières phrases de la session précédente en style atténué (couleur plus sombre), non comptabilisées dans le total du jour
4. Charger les phrases suivantes jusqu'à atteindre le nombre de mots configuré, **en s'arrêtant à la fin d'une phrase complète**
5. **Barre de progression** du livre : `(sentencesCurrent / sentencesTotal) * 100%`, affichée en haut ou en bas de page
6. Bouton **"Terminer la lecture"** → sauvegarde la position, enregistre les stats, redirige vers `translation.html`
7. Bouton **"Continuer à lire"** → charge 20 phrases supplémentaires (sans recompter comme un nouveau bloc)

### 2.4 Entrée de vocabulaire
- En bas de l'écran ou en modal flottante : input `Mot français` + input `Traduction espagnole` + bouton Sauvegarder
- Sauvegarde dans `acad_user_vocab` (compatible v1)
- Feedback visuel sur ajout réussi

### 2.5 Mesure de vitesse de lecture
- `readingStartTime = Date.now()` au premier affichage
- `readingEndTime = Date.now()` au clic sur "Terminer"
- `wordsRead` = comptage exact des mots chargés
- `wpm = wordsRead / (durationMs / 60000)`
- Sauvegardé dans la session du jour dans `acad2_stats`

### 2.6 Navigation
- Paramètre URL : `?day=N` pour accéder à une session spécifique (optionnel, pour debug)
- Bouton retour vers la homepage

---

## 3. Phase de Traductions (`translation.html`)

### 3.1 Identique à `academie/index.html` — `startTranslationChallenge()`
Copier la logique exacte :
- Génération de phrases via API Gemini à partir du vocabulaire utilisateur
- Affichage de la phrase en espagnol
- Bouton "Révéler la traduction française"
- Lecture audio automatique (SpeechSynthesis, voix `fr-FR`)
- Boutons Correct / Incorrect

### 3.2 Différences vs v1
- **Chronomètre par phrase** : `sentenceStartTime = Date.now()` au début de chaque phrase
- `sentenceDuration = Date.now() - sentenceStartTime` au moment de la révélation
- Tableau `translationTimes[]` accumulé pendant la session
- En fin de session : affichage du résumé (nb phrases, temps moyen)
- Sauvegarde dans `acad2_stats` session du jour
- Bouton **"Terminer"** → met à jour le checkpoint du jour comme complété, redirige vers homepage

### 3.3 Comptage des phrases traduites
- Incrémenter le compteur global total dans `acad2_stats`

---

## 4. Modification de `academie/index.html` (v1)

### 4.1 Export de vocabulaire
Dans la modal des clés API (ou une nouvelle modal "Paramètres") :
- Bouton **"Exporter vocabulaire (JSON)"** :
  ```js
  const data = localStorage.getItem('acad_user_vocab');
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'vocabulaire-academie.json'; a.click();
  ```

---

## 5. LocalStorage — Schéma complet

| Clé | Description | Partagée v1 |
|-----|-------------|-------------|
| `acad_user_vocab` | `[{fr, es}]` — vocabulaire | ✅ oui |
| `acad_gemini_keys` | `[string]` — clés API | ✅ oui |
| `acad2_config` | `{wordsPerDay, sentencesPerSession}` | non |
| `acad2_stats` | sessions + streak | non |
| `acad2_reader_progress` | `{sentenceIndex, lastDate}` | non |
| `acad2_days` | `{[dayN]: "completed"\|"pending"}` | non |

---

## 6. Ordre de développement recommandé

1. **`reader.html`** — lecteur immersif + logique de progression + stats lecture
2. **`translation.html`** — copie v1 + chronomètre par phrase + sauvegarde stats
3. **`index.html`** — homepage : timeline + stats + config + charts
4. **Modification `academie/index.html`** — export vocabulaire

---

## 7. Dépendances CDN

```html
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">

<!-- Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<!-- Chart.js (homepage uniquement) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- canvas-confetti (optionnel, célébrations) -->
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
```

---

## 8. Points d'attention

- Toujours stopper le décompte en fin de **phrase** (pas de mot coupé)
- Le bloc de "rappel" des dernières phrases n'entre pas dans le compteur de mots du jour
- Compatibilité maximale avec `localStorage` de l'Académie v1 pour le vocabulaire et les clés API
- Le chronomètre de traduction commence à l'affichage de la phrase, pas à la révélation
- La racha se casse si `lastCompletedDate` n'est pas hier ou aujourd'hui
