## MODIFIED Requirements

### Requirement: Tirage aléatoire des questions
Le système SHALL tirer, sans doublon, le nombre de questions demandé parmi celles de la certification choisie. Si le nombre demandé est absent, nul ou négatif, ou dépasse le nombre de questions disponibles, le système SHALL utiliser toutes les questions disponibles. En mode Examen, le tirage SHALL être uniformément aléatoire. En mode Entraînement, le système SHALL retenir en priorité les questions à revoir après une erreur, puis les questions jamais vues, puis celles dont la révision est échue, puis celles dont l'échéance est la plus proche ; le hasard départage chaque groupe et l'ordre de présentation SHALL rester aléatoire. Un paramètre `seed` dans l'adresse du site SHALL rendre le tirage reproductible.

#### Scenario: Quiz de taille fixe
- **GIVEN** une certification qui contient 61 questions
- **WHEN** l'utilisateur lance un quiz de 10 questions
- **THEN** le quiz contient 10 questions distinctes de cette certification, dans un ordre aléatoire

#### Scenario: Toutes les questions
- **GIVEN** une certification qui contient 40 questions
- **WHEN** l'utilisateur lance un quiz avec l'option « Toutes »
- **THEN** le quiz contient les 40 questions dans un ordre aléatoire

#### Scenario: Erreurs en priorité
- **GIVEN** un entraînement de 5 questions terminé avec 3 erreurs
- **WHEN** l'utilisateur lance un nouvel entraînement de 5 questions sur la même certification et le même thème
- **THEN** les 3 questions ratées en font partie, complétées par des questions jamais vues

#### Scenario: Tirage reproductible
- **GIVEN** le site ouvert avec l'adresse se terminant par `?seed=42`
- **WHEN** l'utilisateur lance un premier quiz
- **THEN** les questions tirées sont les mêmes qu'à une précédente ouverture avec la même graine et les mêmes réglages
