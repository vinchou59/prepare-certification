## Why

Aujourd'hui, chaque quiz est oublié dès qu'on quitte l'écran de résultat : impossible de savoir si l'on progresse, ni de revenir sur les questions ratées. Or retravailler ses erreurs est la façon la plus efficace de se préparer, et suivre son score par rapport au seuil de 85 % indique quand on est prêt pour l'examen.

## What Changes

- Enregistrer chaque quiz terminé dans le navigateur : date, certification, mode, score, pourcentage, durée et résultat de chaque question.
- Tenir, par certification, la liste des questions à retravailler : une question y entre quand elle est ratée et en sort dès qu'elle est réussie.
- Écran de résultat : bouton « Retravailler ces erreurs » qui relance un quiz avec les questions ratées de ce quiz.
- Accueil : bouton « Retravailler mes erreurs » (toutes les questions à retravailler de la certification choisie) et historique des derniers résultats, avec le seuil de réussite.
- Possibilité d'effacer son historique.

## Capabilities

### New Capabilities

- `progress-tracking` : historique des quiz et liste des questions à retravailler, conservés dans le navigateur.

### Modified Capabilities

- `quiz-session` : l'écran de résultat propose de retravailler les erreurs du quiz.

## Impact

- Code : `site/js/quiz-core.js` (fonctions pures d'historique), `site/js/app.js` (accueil et résultat), `site/app.css`.
- Tests : nouveaux cas dans `tests/`.
- Données : stockage local du navigateur (`localStorage`), propre à chaque appareil et à chaque navigateur ; rien n'est envoyé ailleurs.
