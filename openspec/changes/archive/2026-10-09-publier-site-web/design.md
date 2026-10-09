## Context

L'application actuelle est un serveur Java (JDK HTTP server + Jackson) qui sert une interface HTML/CSS/JS et une API JSON. L'interface est déjà écrite en JavaScript sans framework ; seule la logique métier (tirage, correction, score) et le chargement des données vivent côté Java. Le dépôt est sur GitHub et va devenir public.

## Goals / Non-Goals

**Goals:**
- Un site statique publié automatiquement sur GitHub Pages, utilisable sur ordinateur et téléphone.
- Garder l'interface actuelle (écrans, modes, raccourcis) et les règles des specs `quiz-scoring` et `question-bank`.
- Garder des tests automatiques qui bloquent la publication en cas de régression ou de banque incohérente.

**Non-Goals:**
- Comptes utilisateurs, synchronisation entre appareils, historique partagé.
- Cacher les réponses aux utilisateurs techniques (impossible sans serveur).
- Nouvelles fonctionnalités de quiz (historique, révision des erreurs…), traitées dans des changements séparés.

## Decisions

- **Structure du site** : `site/index.html`, `site/app.css`, `site/js/quiz-core.js` (logique pure, sans accès au DOM), `site/js/app.js` (interface), `site/data/` (banques et `certifications.json`). Les scripts sont des modules ES : `quiz-core.js` est importé tel quel par les tests Node.js. Alternative écartée : un framework avec étape de build, inutile pour cette taille.
- **Logique portée telle quelle** : tirage par mélange de Fisher-Yates, correction par égalité d'ensembles (insensible à l'ordre, à la casse et aux doublons), score sans point partiel. Le générateur aléatoire est injectable ; avec `?seed=N`, un générateur déterministe (mulberry32) remplace `Math.random`.
- **Données** : les cinq banques sont déplacées sans modification dans `site/data/`. `certifications.json` remplace l'énumération Java (id, nom court, nom complet, fichier, seuil). L'accueil charge toutes les banques une fois pour afficher les nombres de questions (environ 380 Ko au total).
- **Tests** : lanceur intégré de Node.js (`node --test`), sans dépendance npm. `tests/quiz-core.test.mjs` reprend les cas des tests JUnit de score et de session ; `tests/question-bank.test.mjs` reprend `QuestionBankConsistencyTest` et vérifie aussi `certifications.json`.
- **Publication** : un workflow GitHub Actions (`.github/workflows/pages.yml`) lance les tests puis publie `site/` avec les actions officielles `upload-pages-artifact` et `deploy-pages`. Le job de publication dépend du job de tests.
- **QR code** : bibliothèque `qrcode-generator` 1.4.4 (licence MIT), chargée uniquement au clic sur « Partager » depuis jsDelivr (fichier `qrcode.js` du paquet npm), avec cdnjs en secours. Alternative écartée : l'embarquer dans le dépôt, impossible à télécharger depuis l'environnement de développement actuel ; elle pourra l'être plus tard sans changer le comportement.
- **Polices** : Google Fonts reste chargé comme aujourd'hui, avec des polices système en secours.

## Risks / Trade-offs

- [Réponses lisibles dans les données du site] → Assumé et documenté dans la spec ; l'interface ne les affiche qu'à la correction.
- [Dépôt public : contenu des questions visible de tous] → Accepté par l'utilisateur ; aucune donnée personnelle dans le dépôt.
- [jsDelivr et cdnjs indisponibles] → Le partage reste possible par le lien et le bouton de copie.
- [Rechargement de page pendant un quiz] → Le quiz est perdu ; acceptable pour des quiz de quelques minutes, à reconsidérer avec un futur historique.

## Migration Plan

1. Créer le site et les tests, vérifier en local avec un serveur statique.
2. Supprimer `psm2-quiz/` et mettre à jour README et contexte OpenSpec.
3. L'utilisateur rend le dépôt public et choisit « GitHub Actions » comme source de GitHub Pages.
4. Pousser sur `main` : le workflow teste et publie. Retour arrière : revenir au commit précédent, la version Java reste dans l'historique git.

## Open Questions

_Aucune._
