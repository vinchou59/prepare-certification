## MODIFIED Requirements

### Requirement: Réglages du quiz
L'accueil SHALL permettre de choisir la certification (avec son nombre de questions disponibles), puis le mode (Entraînement ou Examen). En mode Entraînement, l'accueil SHALL proposer le nombre de questions (5, 10, 20 ou toutes). En mode Examen, l'accueil MUST NOT proposer de nombre de questions : il SHALL afficher le nombre de questions, la durée et le seuil de réussite de l'examen, ainsi qu'une mention quand la durée est ajustée à une banque plus petite que l'examen officiel. Les derniers réglages SHOULD être mémorisés dans le navigateur et proposés au prochain lancement.

#### Scenario: Réglages mémorisés
- **GIVEN** un premier quiz lancé en PSK I, mode Entraînement, 20 questions
- **WHEN** l'utilisateur revient à l'accueil plus tard dans le même navigateur
- **THEN** PSK I, Entraînement et 20 sont présélectionnés

#### Scenario: Format d'examen affiché
- **GIVEN** la certification PSM II sélectionnée
- **WHEN** l'utilisateur choisit le mode Examen
- **THEN** le choix du nombre de questions disparaît et l'accueil affiche 30 questions, 90 minutes et le seuil de 85 %

### Requirement: Mode Examen
En mode Examen, le quiz SHALL reprendre le format de l'examen officiel de la certification : son nombre de questions et sa durée. Si la banque contient moins de questions, l'examen SHALL utiliser toutes les questions disponibles et une durée au prorata, arrondie à la minute (au moins une minute). Un quiz « Retravailler mes erreurs » en mode Examen SHALL suivre la même règle de prorata. Le système SHALL afficher un compte à rebours, signalé visuellement dans la dernière minute, permettre de naviguer librement entre les questions et ne montrer aucune correction avant la fin. Quand le temps est écoulé, le quiz SHALL se terminer automatiquement : les questions sans réponse comptent comme fausses et le résultat indique que le temps est écoulé. Si des questions restent sans réponse ou marquées « à revoir » quand l'utilisateur termine lui-même, le système SHALL le prévenir, en précisant leur nombre, et proposer d'y retourner ou de terminer quand même.

#### Scenario: Examen au format officiel
- **GIVEN** la certification PSM II, dont la banque contient 61 questions
- **WHEN** l'utilisateur lance un examen
- **THEN** l'examen compte 30 questions et le compte à rebours démarre à 90:00

#### Scenario: Banque plus petite que l'examen
- **GIVEN** la certification PSK I (examen officiel : 45 questions en 60 minutes) dont la banque contient 40 questions
- **WHEN** l'utilisateur lance un examen
- **THEN** l'examen compte les 40 questions et le compte à rebours démarre à 53:00

#### Scenario: Temps écoulé
- **GIVEN** un examen en cours dont 5 questions sont sans réponse
- **WHEN** le compte à rebours atteint zéro
- **THEN** le quiz se termine sans avertissement, les 5 questions comptent comme fausses et le résultat indique « Temps écoulé »

#### Scenario: Terminer avec des questions sans réponse
- **GIVEN** un examen de 10 questions dont 3 sans réponse
- **WHEN** l'utilisateur clique sur « Terminer l'examen »
- **THEN** un avertissement indique que 3 questions compteront comme fausses, avec les choix « Y retourner » et « Terminer quand même »

#### Scenario: Terminer avec des questions marquées
- **GIVEN** un examen dont toutes les questions ont une réponse, dont 2 marquées à revoir
- **WHEN** l'utilisateur clique sur « Terminer l'examen »
- **THEN** un avertissement indique que 2 questions sont marquées à revoir ; « Y retourner » mène à la première d'entre elles
