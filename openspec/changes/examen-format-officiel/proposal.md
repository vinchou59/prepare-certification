## Why

Le mode Examen reprend aujourd'hui le nombre de questions choisi pour l'entraînement et affiche un simple chronomètre : il ne met pas en condition réelle. Un examen blanc doit reprendre le format officiel (nombre de questions, durée), décompter le temps et s'arrêter automatiquement, comme le vrai examen.

## What Changes

- Accueil : le mode se choisit avant le reste. En Entraînement, on choisit le nombre de questions ; en Examen, on voit le nombre de questions, la durée et le seuil de l'examen officiel.
- Examen : compte à rebours au lieu du chronomètre, alerte visuelle dans la dernière minute, fin automatique quand le temps est écoulé (questions sans réponse comptées fausses).
- Quand la banque contient moins de questions que l'examen officiel, l'examen utilise toutes les questions disponibles avec une durée au prorata (même temps par question que le vrai examen).
- Formats officiels ajoutés dans `certifications.json` : PSM II 30 questions en 90 min, PSPO I 80 en 60, PSK I 45 en 60, PSM-AI 40 en 60, CCA Agile 60 en 60.
- Seuils de réussite : PSM-AI et CCA Agile passent à 85 %, comme les autres.

## Capabilities

### New Capabilities

_Aucune._

### Modified Capabilities

- `quiz-session` : réglages selon le mode, examen au format officiel avec compte à rebours et fin automatique.
- `quiz-scoring` : seuils de réussite de toutes les certifications connus (85 %).
- `question-bank` : déclaration du format d'examen de chaque certification.

## Impact

- Données : `site/data/certifications.json`.
- Code : `site/js/quiz-core.js` (calcul du format d'examen), `site/js/app.js`, `site/app.css`.
- Tests : format d'examen (prorata, plafonnement), validation de `certifications.json`.
