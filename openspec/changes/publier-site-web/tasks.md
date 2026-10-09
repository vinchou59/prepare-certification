## 1. Logique du quiz en JavaScript

- [x] 1.1 Créer `site/js/quiz-core.js` : tirage (avec graine optionnelle), correction d'une question, fin de quiz idempotente avec score, pourcentage, durée et seuil. Vérification : `node --test` sur `tests/quiz-core.test.mjs`, qui reprend les cas des tests JUnit.
- [x] 1.2 Créer `site/data/certifications.json` et déplacer les cinq banques dans `site/data/`. Vérification : `tests/question-bank.test.mjs` (reprise de `QuestionBankConsistencyTest` + cohérence du fichier des certifications) au vert.

## 2. Interface en site statique

- [x] 2.1 Adapter `app.js` pour charger les données et appeler `quiz-core.js` au lieu de l'API ; retirer « Quitter l'application » ; gérer `?seed=`. Vérification : parcours complet en Entraînement et en Examen dans un navigateur, servi par un serveur statique.
- [x] 2.2 Ajouter le bouton « Partager » (adresse, copie, QR code chargé à la demande, repli sans QR code). Vérification : QR code scannable, et repli testé en bloquant cdnjs.
- [x] 2.3 Vérifier l'affichage sur mobile (390 px) et en mode sombre. Vérification : captures d'écran sans débordement horizontal.

## 3. Publication

- [x] 3.1 Ajouter `package.json` (script `test`) et `.github/workflows/pages.yml` (tests puis publication de `site/`). Vérification : syntaxe du workflow relue, tests lancés localement par `npm test`.
- [x] 3.2 Supprimer `psm2-quiz/` et les fichiers liés ; mettre à jour `.gitignore`, `README.md` et le contexte de `openspec/config.yaml`. Vérification : plus aucune référence à Java ou Maven hors historique et archives OpenSpec.
- [ ] 3.3 Guider l'utilisateur pour rendre le dépôt public et activer GitHub Pages (source : GitHub Actions), puis vérifier le premier déploiement. Vérification : le site répond à son adresse publique.
