# Quiz Scoring Specification

## Purpose
Règles métier d'un quiz : tirage des questions, validation d'une réponse, calcul du score et comparaison au seuil de réussite de l'examen officiel. Ces règles vivent dans la couche `domain` (`QuizService`) et sont appliquées côté serveur (`QuizSession`).

## Requirements

### Requirement: Tirage aléatoire des questions
Le système SHALL tirer au hasard, sans doublon, le nombre de questions demandé parmi celles de la certification choisie. Si le nombre demandé est absent, nul ou négatif, ou dépasse le nombre de questions disponibles, le système SHALL utiliser toutes les questions disponibles.

#### Scenario: Quiz de taille fixe
- **GIVEN** une certification qui contient 63 questions
- **WHEN** l'utilisateur lance un quiz de 10 questions
- **THEN** le quiz contient 10 questions distinctes de cette certification, dans un ordre aléatoire

#### Scenario: Toutes les questions
- **GIVEN** une certification qui contient 40 questions
- **WHEN** l'utilisateur lance un quiz avec l'option « Toutes »
- **THEN** le quiz contient les 40 questions dans un ordre aléatoire

#### Scenario: Tirage reproductible
- **GIVEN** l'application lancée avec la propriété système `-Dquiz.seed=42`
- **WHEN** l'utilisateur lance un premier quiz après le démarrage
- **THEN** les questions tirées sont les mêmes qu'à un précédent lancement avec la même graine

### Requirement: Réponse juste uniquement si elle est exacte
Une réponse SHALL être considérée comme juste si et seulement si l'ensemble des lettres choisies est égal à l'ensemble des bonnes réponses. L'ordre, la casse et les doublons des lettres MUST NOT avoir d'influence. Une réponse partielle, excédentaire ou absente SHALL être considérée comme fausse.

#### Scenario: Bonnes réponses dans le désordre
- **GIVEN** une question dont les bonnes réponses sont A et B
- **WHEN** l'utilisateur répond « b, A »
- **THEN** la réponse est juste

#### Scenario: Réponse partielle
- **GIVEN** une question dont les bonnes réponses sont A et B
- **WHEN** l'utilisateur répond seulement A
- **THEN** la réponse est fausse

#### Scenario: Question sans réponse
- **GIVEN** un quiz en mode Examen
- **WHEN** l'utilisateur termine le quiz sans avoir répondu à une question
- **THEN** cette question est comptée fausse et marquée « Sans réponse » dans la correction

### Requirement: Calcul du score
Le score SHALL être le nombre de réponses justes sur le nombre de questions du quiz, sans point partiel. Le pourcentage affiché SHALL être ce ratio arrondi à l'entier le plus proche. La durée SHALL être mesurée par le serveur entre le lancement et la fin du quiz.

#### Scenario: Score d'un quiz
- **GIVEN** un quiz de 10 questions
- **WHEN** l'utilisateur termine avec 8 réponses justes
- **THEN** le résultat affiche 8/10 et 80 %

#### Scenario: Fin de quiz idempotente
- **GIVEN** un quiz déjà terminé
- **WHEN** la fin du quiz est demandée une seconde fois, avec d'autres réponses
- **THEN** le résultat renvoyé est celui de la première fin, inchangé

### Requirement: Seuil de réussite officiel
Chaque certification MAY avoir un seuil de réussite connu, en pourcentage. Lorsqu'il est connu, le système SHALL indiquer si le score atteint ce seuil (score ≥ seuil). Lorsqu'il est inconnu, le système MUST NOT afficher de seuil ni de verdict de réussite.

Seuils actuels : PSM II, PSPO I et PSK I à 85 % ; CCA Agile et PSM-AI sans seuil connu.

#### Scenario: Seuil atteint
- **GIVEN** un quiz PSPO I de 20 questions
- **WHEN** l'utilisateur obtient 17/20 (85 %)
- **THEN** le résultat indique que le score est au-dessus du seuil de 85 %

#### Scenario: Seuil inconnu
- **GIVEN** un quiz CCA Agile terminé
- **WHEN** le résultat s'affiche
- **THEN** seuls le score, le pourcentage et la durée sont affichés, sans seuil ni verdict
