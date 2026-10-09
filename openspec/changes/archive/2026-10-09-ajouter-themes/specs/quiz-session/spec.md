## ADDED Requirements

### Requirement: Entraînement par thème
En mode Entraînement, l'accueil SHALL proposer de choisir un thème de la certification, ou « Tous », avec le nombre de questions de chaque thème. Un quiz lancé sur un thème SHALL ne contenir que des questions de ce thème. Le choix SHOULD être mémorisé. En mode Examen, le thème MUST NOT être proposé ni appliqué. Le thème de la question SHALL être affiché sous son numéro, pendant le quiz et dans la correction.

#### Scenario: Quiz sur un thème
- **GIVEN** la certification PSM II, le mode Entraînement et le thème « Événements » (9 questions)
- **WHEN** l'utilisateur lance un quiz de 5 questions
- **THEN** les 5 questions sont du thème « Événements », et ce thème est affiché sous chaque numéro de question

#### Scenario: Examen tous thèmes
- **GIVEN** un thème choisi en Entraînement
- **WHEN** l'utilisateur passe en mode Examen
- **THEN** le choix du thème disparaît et l'examen tire ses questions parmi toute la certification
