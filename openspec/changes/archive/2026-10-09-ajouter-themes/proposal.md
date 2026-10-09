## Why

Un score global ne dit pas où l'on pèche. Classer les questions par thème permet de voir ses points faibles (par exemple « Organisation et passage à l'échelle » en PSM II) et de s'entraîner spécifiquement dessus.

## What Changes

- Déclarer, pour chaque certification, une liste de thèmes dans `certifications.json` (identifiant et libellé en français).
- Ajouter un champ `theme` à chacune des 248 questions. Les questions elles-mêmes ne changent pas (elles proviennent d'examens réels).
- Accueil, mode Entraînement : choix d'un thème (« Tous » par défaut), avec le nombre de questions de chaque thème.
- Accueil : « Points faibles par thème », du plus faible au plus solide, avec le taux de réussite et un bouton « S'entraîner » qui lance un entraînement sur ce thème.
- Le thème est affiché sous le numéro de la question, pendant le quiz et dans la correction.

## Capabilities

### Modified Capabilities

- `question-bank` : thèmes déclarés par certification, thème obligatoire pour chaque question.
- `quiz-session` : filtre par thème en mode Entraînement, thème affiché.
- `progress-tracking` : points faibles par thème.

## Impact

- Données : `site/data/certifications.json` et les 5 fichiers de questions (ajout d'une ligne `theme` par question).
- Code : `site/js/quiz-core.js` (`filterByTheme`, `themeStats`, `weakThemes`), `site/js/app.js`, `site/app.css`.
- Tests : `tests/themes.test.mjs`, vérifications ajoutées dans `tests/question-bank.test.mjs`.
