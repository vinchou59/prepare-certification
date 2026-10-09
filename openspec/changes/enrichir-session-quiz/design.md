## Context

`quiz-core.js` tire les questions et corrige à partir des lettres choisies ; `app.js` affiche les questions via des vues sans réponses. L'historique enregistre les résultats par identifiant de question, pas par lettre.

## Goals / Non-Goals

**Goals:**
- Trois améliorations de l'écran de quiz, sans changer le calcul du score ni le format de l'historique.

**Non-Goals:**
- Marquage en mode Entraînement (chaque question y est corrigée aussitôt).
- Formulaire de signalement intégré au site (il faudrait un serveur).

## Decisions

- **Mélange dans `createQuiz`** : chaque question tirée est copiée avec ses choix réordonnés et relettrés (A, B, C… dans l'ordre affiché) ; `isCorrect` et les explications suivent leur choix. Toute la suite (correction, résultat, revue) travaille sur cette copie, donc les lettres de la correction sont celles que l'utilisateur a vues. L'historique, indexé par identifiant de question, n'est pas affecté.
- **Choix ancrés** : un choix reste à sa place en fin de liste si son texte correspond à « All/None of the above », « All of the answers », « All answers apply » (motif insensible à la casse). Une question dont tous les choix sont Vrai/Faux ou True/False n'est pas mélangée.
- **Générateur partagé** : le même générateur aléatoire (déterministe avec `?seed=`) sert au tirage des questions et au mélange des choix.
- **Marquage** : état d'interface uniquement (`flagged`, par identifiant de question), réinitialisé à chaque quiz, non enregistré dans l'historique.
- **Signalement** : lien `https://github.com/vinchou59/prepare-certification/issues/new` avec `title` et `body` encodés dans l'adresse ; le corps cite la certification, l'identifiant, le texte de la question et les textes des choix, jamais les lettres.
- **Test de cohérence** : motif « option/answer/choice/réponse/choix + lettre » dans les textes et les explications.

## Risks / Trade-offs

- [Un choix ancré non détecté serait mélangé] → Le motif couvre les 10 cas actuels ; une nouvelle formulation se corrigera en ajustant le motif.
- [Adresse de signalement trop longue pour certaines questions] → Le texte de la question est tronqué à 1 000 caractères dans le corps de l'issue.

## Migration Plan

Aucune : le réglage de mélange est activé par défaut, l'historique existant reste valide.

## Open Questions

_Aucune._
