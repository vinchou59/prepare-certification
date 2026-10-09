## Why

L'outil ne fonctionne aujourd'hui que sur le Mac de son auteur : il faut Java 25, Maven et un lanceur local. Pour le partager avec d'autres personnes qui préparent leurs certifications, il doit être accessible depuis n'importe quel navigateur, y compris sur téléphone, sans installation, à une adresse fixe qu'on peut transmettre par un lien ou un QR code.

## What Changes

- **BREAKING** L'application devient un site 100 % navigateur : le serveur Java, Maven, `launch_quiz.command` et `setup_java25.command` sont supprimés.
- La logique du quiz (tirage, correction, score) est portée en JavaScript dans un module sans dépendance, testé avec le lanceur de tests intégré à Node.js.
- Les banques de questions et la liste des certifications deviennent des fichiers de données du site (`site/data/`).
- Le site est publié automatiquement sur GitHub Pages à chaque push sur `main`, uniquement si les tests passent.
- Un bouton « Partager » affiche le QR code et le lien du site.
- **BREAKING** Les bonnes réponses sont chargées dans le navigateur avec les questions : l'interface ne les montre qu'à la correction, mais elles sont lisibles dans les données du site. Choix assumé pour un outil d'entraînement.

## Capabilities

### New Capabilities

- `site-publication` : publication automatique du site et partage par lien ou QR code.

### Modified Capabilities

- `quiz-session` : l'application est un site en ligne et non plus un serveur local ; la confidentialité des réponses devient une règle d'affichage ; les quiz ne sont plus conservés par un serveur.
- `quiz-scoring` : le tirage reproductible passe par l'adresse du site ; la durée est mesurée par le navigateur.
- `question-bank` : emplacement des fichiers et déclaration des certifications dans un fichier de données ; chargement par le navigateur.

## Impact

- Supprimés : `psm2-quiz/` (code Java, `pom.xml`, tests JUnit, lanceurs).
- Ajoutés : `site/` (page, styles, scripts, données), `tests/` (tests Node.js), `.github/workflows/pages.yml`, `package.json` minimal pour les tests.
- Dépôt GitHub rendu public et GitHub Pages activé (actions manuelles de l'utilisateur).
- `README.md` et le contexte `openspec/config.yaml` mis à jour.
