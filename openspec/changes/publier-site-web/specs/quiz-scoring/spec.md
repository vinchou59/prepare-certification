## MODIFIED Requirements

### Requirement: Tirage aléatoire des questions
Le système SHALL tirer au hasard, sans doublon, le nombre de questions demandé parmi celles de la certification choisie. Si le nombre demandé est absent, nul ou négatif, ou dépasse le nombre de questions disponibles, le système SHALL utiliser toutes les questions disponibles. Un paramètre `seed` dans l'adresse du site SHALL rendre le tirage reproductible.

#### Scenario: Quiz de taille fixe
- **GIVEN** une certification qui contient 61 questions
- **WHEN** l'utilisateur lance un quiz de 10 questions
- **THEN** le quiz contient 10 questions distinctes de cette certification, dans un ordre aléatoire

#### Scenario: Toutes les questions
- **GIVEN** une certification qui contient 40 questions
- **WHEN** l'utilisateur lance un quiz avec l'option « Toutes »
- **THEN** le quiz contient les 40 questions dans un ordre aléatoire

#### Scenario: Tirage reproductible
- **GIVEN** le site ouvert avec l'adresse se terminant par `?seed=42`
- **WHEN** l'utilisateur lance un premier quiz
- **THEN** les questions tirées sont les mêmes qu'à une précédente ouverture avec la même graine et les mêmes réglages

### Requirement: Calcul du score
Le score SHALL être le nombre de réponses justes sur le nombre de questions du quiz, sans point partiel. Le pourcentage affiché SHALL être ce ratio arrondi à l'entier le plus proche. La durée SHALL être mesurée par le navigateur entre le lancement et la fin du quiz.

#### Scenario: Score d'un quiz
- **GIVEN** un quiz de 10 questions
- **WHEN** l'utilisateur termine avec 8 réponses justes
- **THEN** le résultat affiche 8/10 et 80 %

#### Scenario: Fin de quiz idempotente
- **GIVEN** un quiz déjà terminé
- **WHEN** la fin du quiz est demandée une seconde fois, avec d'autres réponses
- **THEN** le résultat reste celui de la première fin, inchangé
