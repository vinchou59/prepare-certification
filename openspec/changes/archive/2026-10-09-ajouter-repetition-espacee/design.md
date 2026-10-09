## Context

L'historique (`quiz.history`, 200 quiz au plus) contient la date et le résultat de chaque question de chaque quiz terminé.

## Decisions

- **Boîtes calculées, pas stockées** : on rejoue l'historique du plus ancien au plus récent. Une bonne réponse fait monter d'une boîte (jusqu'à 5) ; une question réussie dès sa première apparition va en boîte 2 ; une erreur renvoie en boîte 1. Effacer l'historique remet donc tout à zéro, sans structure supplémentaire à maintenir.
- **Délais** : boîte 1 immédiat, 2 → 1 jour, 3 → 3 jours, 4 → 7 jours, 5 → 14 jours après la dernière réponse. Maîtrisée = boîte 4 ou 5.
- **Priorités de l'Entraînement** : erreurs (boîte 1), jamais vues, échues, puis non échues par échéance la plus proche. Le hasard départage au sein de chaque groupe, et les questions retenues sont mélangées pour ne pas présenter toutes les erreurs en premier. Sans historique, le comportement reste un tirage au hasard.
- **Examen inchangé** : un examen blanc doit refléter l'examen réel, donc tirage uniforme ; ses réponses alimentent tout de même les boîtes.
- **Quiz d'erreurs** : « Retravailler mes erreurs » garde la liste complète des questions dont le dernier résultat est faux.
