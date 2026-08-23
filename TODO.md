# TODO — Académie 2

## Leçon orientée production (article → dictée → oral)

### carnet.js — module partagé
- [x] 23 catégories d'erreurs (écrit / oral / les deux)
- [x] Stockage `acad2_carnet` : points + séances
- [x] `record()` : nouveaux points, points répétés, récidives
- [x] Passage automatique en « maîtrisé » après 3 séances propres
- [x] `confirmed` : un point réussi en contexte progresse deux fois plus vite
- [x] Rapprochement des points par identifiant puis par libellé approchant
- [x] `summaryForPrompt()` : carnet sérialisé pour l'IA
- [x] `renderChangelog()` : bilan identique dans la dictée et l'oral
- [x] Export / import / réinitialisation
- [x] `AIRelay` : ouverture de Claude préremplie, copie, parsing JSON tolérant

### article.html — dictée
- [x] Retrait de l'exercice écrit ES→FR et de l'exercice de conversation
- [x] Source de la dictée : `dictation.text` / `dictation.units`
- [x] Repli sur un extrait de l'article, en évitant les chiffres
- [x] Découpage automatique en unités de 3 à 10 mots
- [x] Étape 1 : une écoute complète à 0.9×, sans texte
- [x] Étape 2 : unités ralenties (0.5× à 0.85×), répétition libre, clic pour avancer
- [x] Option « Ponctuation annoncée »
- [x] Article et vocabulaire floutés pendant l'exercice
- [x] Brouillon repris après un rechargement
- [x] Prompt de correction : texte original + sa copie + son carnet
- [x] Analyse erreur par erreur (indice → correction → règle → statut carnet)
- [x] Bilan : score, diff mot à mot, changements du carnet
- [x] Relecture finale du texte correct, phrase surlignée
- [x] Déblocage de l'expression orale + journée marquée complétée

### oral.html — expression orale
- [x] Sujets proposés depuis `oralTopics`, repli générique sinon
- [x] Objectif 20 min : barre de progression, temps restant, dépassement
- [x] Relances cliquables et vocabulaire à replacer pendant la conversation
- [x] Notation des erreurs en direct (dit / correction / catégorie / horodatage)
- [x] Revue finale : correction, catégorie, rattachement à un point du carnet
- [x] Conservation du chrono, des 3 critères, de la courbe et de l'historique
- [x] Colonne « erreurs » et marque d'objectif atteint dans l'historique

### carnet.html
- [x] Compteurs : à travailler / en progrès / maîtrisés / séances
- [x] Courbe erreurs par séance vs points maîtrisés (cumul)
- [x] Répartition par catégorie
- [x] Liste filtrable (statut, catégorie) avec exemples et jauge de séances propres
- [x] Marquer maîtrisé / à retravailler / supprimer
- [x] Export, import fusionnant, effacement complet

### index.html
- [x] Accès au carnet dans la navbar
- [x] Statistiques : dictées corrigées, points maîtrisés
- [x] Courbe des scores de dictée

### prompt.txt
- [x] Niveau B2, article de 200 à 250 mots
- [x] Champ `dictation` (texte sans chiffres, 90-120 mots, + unités)
- [x] Champ `oralTopics` (4 sujets × 4 relances)
- [x] Retrait de `conversation` et `writingExercise`
- [x] 2 commentaires au lieu de 5 (une prise de position + un vécu ou un décalé)
- [x] Ponctuation annoncée à voix haute : la garder simple dans la dictée

---

### Aperçu local (temporaire)
- [x] `make-local.py` : embarque un article non poussé dans `articles-local.js`
- [x] index.html : articles locaux en tête du catalogue, badge « local »
- [x] index.html : liste utilisable même si GitHub Pages est injoignable
- [x] article.html / oral.html : aperçu local servi avant le réseau

---

## Pendant / améliorations futures
- [ ] Après avoir poussé l'article de la rentrée : `python3 make-local.py`
      (et supprimer `make-local.py` / `articles-local.js` si le besoin disparaît)
- [ ] `translation.html` n'est plus dans le parcours : à supprimer ou à rebrancher
- [ ] Les 72 articles existants restent en B1 et sans texte de dictée dédié
      (le repli automatique s'en charge) — à régénérer petit à petit
- [ ] Enregistrement audio de l'expression orale pour réécoute
- [ ] Reprise ciblée : une dictée générée à partir des points actifs du carnet
- [ ] Test de la synthèse vocale sur Safari iOS (voix `fr-FR` disponibles)
