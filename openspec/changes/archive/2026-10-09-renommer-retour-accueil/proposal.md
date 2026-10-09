## Why

À la fin d'un quiz, le bouton « Changer de réglages » ramène en fait à l'accueil : son libellé ne dit pas ce qu'il fait, et il se remarque mal à côté des deux autres boutons.

## What Changes

- Renommer le bouton en « Retour à l'accueil ».
- L'afficher en rouge pour qu'on le repère tout de suite.

## Capabilities

### Modified Capabilities

- `quiz-session` : libellé et mise en évidence du bouton de retour à l'accueil sur l'écran de résultat.

## Impact

- Code : `site/js/app.js`, `site/app.css` (style `.btn.danger`, clair et sombre).
