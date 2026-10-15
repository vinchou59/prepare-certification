## Why

Avec sept certifications, la liste en grandes cartes occupe plus d'un écran de téléphone avant même le choix du mode. Les certifications apparaissent en outre dans l'ordre du fichier, qui mélange les niveaux, et le nom complet de CCA Agile est inexact.

## What Changes

- Afficher les certifications sous forme de pastilles compactes (nom court et nombre de questions), dans le style des pastilles de thèmes ; le nom complet et le nombre de questions de la certification choisie s'affichent sous les pastilles.
- Trier les certifications dans un ordre logique : PSM I, PSM II, PSPO I, PSD I, PSK I, PSM-AI, puis CCA Agile. Les certifications sans questions disponibles passent en dernier, grisées.
- Renommer le nom complet de CCA Agile en « Centre de Certification Agile - Agile ».

## Capabilities

### Modified Capabilities

- `quiz-session` : présentation et ordre des certifications à l'accueil.
- `question-bank` : l'ordre de déclaration dans `certifications.json` est l'ordre d'affichage.

## Impact

- Code : `site/js/app.js` (rendu de l'accueil), `site/js/quiz-core.js` (tri des certifications), `site/app.css` (pastilles), `site/data/certifications.json` (ordre, nom de CCA Agile).
- Tests : tri des certifications dans `tests/quiz-core.test.mjs`.
