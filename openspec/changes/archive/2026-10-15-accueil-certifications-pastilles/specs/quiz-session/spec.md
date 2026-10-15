## MODIFIED Requirements

### Requirement: Réglages du quiz
L'accueil SHALL permettre de choisir la certification, puis le mode (Entraînement ou Examen). Les certifications SHALL être présentées sous forme de pastilles compactes affichant le nom court et le nombre de questions disponibles, dans l'ordre de déclaration de `certifications.json` ; les certifications sans questions disponibles SHALL apparaître en dernier, désactivées. Le nom complet et le nombre de questions de la certification choisie SHALL être affichés sous les pastilles. En mode Entraînement, l'accueil SHALL proposer le nombre de questions (5, 10, 20 ou toutes). En mode Examen, l'accueil MUST NOT proposer de nombre de questions : il SHALL afficher le nombre de questions, la durée et le seuil de réussite de l'examen, ainsi qu'une mention quand la durée est ajustée à une banque plus petite que l'examen officiel. Les derniers réglages SHOULD être mémorisés dans le navigateur et proposés au prochain lancement.

#### Scenario: Réglages mémorisés
- **GIVEN** un premier quiz lancé en PSK I, mode Entraînement, 20 questions
- **WHEN** l'utilisateur revient à l'accueil plus tard dans le même navigateur
- **THEN** PSK I, Entraînement et 20 sont présélectionnés

#### Scenario: Format d'examen affiché
- **GIVEN** la certification PSM II sélectionnée
- **WHEN** l'utilisateur choisit le mode Examen
- **THEN** le choix du nombre de questions disparaît et l'accueil affiche 30 questions, 90 minutes et le seuil de 85 %

#### Scenario: Certifications en pastilles
- **GIVEN** l'accueil avec PSPO I sélectionnée
- **WHEN** il s'affiche
- **THEN** chaque certification apparaît en pastille avec son nom court et son nombre de questions, et « Professional Scrum Product Owner I · 223 questions » s'affiche sous les pastilles

#### Scenario: Certification sans questions
- **GIVEN** une certification déclarée dont le fichier de questions est introuvable
- **WHEN** l'accueil s'affiche
- **THEN** sa pastille apparaît en dernier, désactivée, avec la mention « indisponible »
