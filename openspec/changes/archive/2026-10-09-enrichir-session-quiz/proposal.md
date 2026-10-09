## Why

Trois manques freinent un entraînement efficace : en mode Examen on ne peut pas mettre de côté une question pour y revenir, comme dans le vrai examen ; les réponses apparaissent toujours dans le même ordre, ce qui fait retenir une lettre plutôt qu'une réponse ; et une question douteuse ne peut être signalée qu'en dehors de l'outil.

## What Changes

- Mode Examen : marquer une question « à revoir », la voir sur la barre de progression, être prévenu à la fin s'il reste des questions marquées.
- Mélanger l'ordre des réponses à chaque quiz, avec des lettres réattribuées dans l'ordre affiché. Les réponses « All of the above » ou « None of the above » restent en dernier, les questions Vrai/Faux gardent leur ordre. Réglage à l'accueil, activé par défaut ; `?seed=` rend aussi ce mélange reproductible.
- Lien « Signaler un problème » sous chaque correction : il ouvre une issue GitHub pré-remplie (certification, numéro, texte de la question).
- Corriger l'explication PSK #36 D, qui cite une lettre, et interdire ces références dans les banques (test de cohérence).

## Capabilities

### New Capabilities

_Aucune._

### Modified Capabilities

- `quiz-session` : marquage en mode Examen, ordre des réponses mélangé, signalement d'une question.
- `question-bank` : les explications et les textes des choix ne citent pas d'autres choix par leur lettre.

## Impact

- Code : `site/js/quiz-core.js` (mélange des choix), `site/js/app.js`, `site/app.css`.
- Données : `site/data/questions_psk.json` (une explication).
- Tests : mélange, réponses ancrées, Vrai/Faux, références à des lettres.
- Le signalement demande un compte GitHub à la personne qui signale.
