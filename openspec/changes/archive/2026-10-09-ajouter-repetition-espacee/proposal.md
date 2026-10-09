## Why

Le tirage au hasard repropose souvent des questions déjà maîtrisées et laisse longtemps de côté celles jamais vues ou ratées. La répétition espacée (système de Leitner) fait revenir une question d'autant plus tard qu'elle est bien connue : on révise moins pour retenir mieux.

## What Changes

- Calculer, à partir de l'historique existant, la « boîte » de chaque question (1 à 5) : une bonne réponse la fait monter, une erreur la renvoie en boîte 1. Chaque boîte a un délai avant la prochaine révision (0, 1, 3, 7 et 14 jours).
- En mode Entraînement, choisir les questions dans cet ordre : erreurs à revoir, questions jamais vues, révisions arrivées à échéance, puis celles dont l'échéance est la plus proche. L'ordre de présentation reste aléatoire.
- L'examen blanc garde un tirage au hasard.
- Accueil : « Ma progression », avec la répartition maîtrisées / en cours / à revoir / jamais vues et le nombre de questions à réviser.

## Capabilities

### Modified Capabilities

- `quiz-scoring` : sélection des questions de l'Entraînement par répétition espacée.
- `progress-tracking` : niveau de maîtrise par question et bilan à l'accueil.

## Impact

- Code : `site/js/quiz-core.js` (`questionProgress`, `pickForReview`, `masterySummary`), `site/js/app.js`, `site/app.css`.
- Tests : `tests/spaced-repetition.test.mjs`.
- Données : aucune nouvelle donnée stockée ; tout se déduit de `quiz.history`.
