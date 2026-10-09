## Context

Le site est statique, sans compte ni serveur. Les réglages sont déjà mémorisés dans `localStorage` via un petit utilitaire tolérant aux erreurs (`store`) dans `app.js`. La logique métier pure vit dans `quiz-core.js`, testée par Node.js.

## Goals / Non-Goals

**Goals:**
- Retravailler les erreurs en un clic, depuis le résultat et depuis l'accueil.
- Voir sa progression récente par rapport au seuil de réussite.

**Non-Goals:**
- Synchroniser l'historique entre appareils ou navigateurs.
- Graphiques détaillés, statistiques par thème ou répétition espacée (changements futurs possibles).

## Decisions

- **Format stocké** : une seule clé `quiz.history`, tableau d'entrées `{ date, certification, mode, score, total, percent, durationSeconds, results: { "<id>": true|false } }`, les plus récentes en premier, limité à 200 entrées (quelques dizaines de Ko au plus). Alternative écartée : une clé par certification, plus complexe à effacer et sans gain réel.
- **Questions à retravailler calculées, pas stockées** : la liste se déduit de l'historique en gardant, pour chaque question, le résultat le plus récent. Pas de seconde structure à garder cohérente. Les identifiants absents de la banque actuelle sont ignorés au moment de lancer le quiz.
- **Logique pure dans `quiz-core.js`** : `recordResult(history, entry, limit)` et `questionsToRework(history, certificationId)` sont testées sans navigateur ; `app.js` ne fait que lire et écrire `localStorage`.
- **Quiz ciblé** : `createQuiz` accepte déjà une liste de questions ; un quiz d'erreurs passe la sous-liste filtrée, avec la taille « toutes ».
- **Confirmation d'effacement dans la page** (pas de `confirm()` du navigateur), cohérente avec l'avertissement de fin d'examen.

## Risks / Trade-offs

- [Historique perdu si l'utilisateur vide les données du navigateur] → Assumé ; mentionné dans l'interface (« enregistré sur cet appareil »).
- [Identifiants de questions modifiés ou supprimés lors d'une correction de banque] → Les identifiants inconnus sont ignorés ; les ids restent stables par convention (on ne renumérote pas).

## Migration Plan

Aucune : en l'absence de clé `quiz.history`, l'historique est simplement vide.

## Open Questions

_Aucune._
