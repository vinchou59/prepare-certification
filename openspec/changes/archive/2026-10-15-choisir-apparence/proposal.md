## Why

Le site suit uniquement le thème clair ou sombre du système. Quelqu'un dont l'appareil est en mode sombre ne peut pas afficher le site en clair, et inversement.

## What Changes

- Ajouter un réglage « Apparence » en bas de l'accueil : Automatique (thème du système, par défaut), Clair ou Sombre.
- Mémoriser ce choix dans le navigateur et l'appliquer dès le chargement de la page, sans flash de l'autre thème.

## Capabilities

### Modified Capabilities

- `quiz-session` : choix de l'apparence du site.

## Impact

- Code : `site/index.html` (application du thème avant l'affichage), `site/app.css` (couleurs sombres forçables), `site/js/app.js` (réglage et mémorisation), `site/js/quiz-core.js` (validation de la valeur).
- Tests : validation de la valeur d'apparence dans `tests/quiz-core.test.mjs`.
