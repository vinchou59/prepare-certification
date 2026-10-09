## MODIFIED Requirements

### Requirement: Un fichier JSON par certification
Chaque certification SHALL avoir son fichier `site/data/questions_<certif>.json`, de la forme `{"questions": [...]}`. Chaque question SHALL avoir un `id` entier unique dans le fichier, un texte `question`, un nombre `expectedAnswers` et une liste `choices`. Chaque choix SHALL avoir une lettre `label` (A, B, C… dans l'ordre), un `text`, un booléen `isCorrect` et une `explanation` non vide, qui justifie ce choix précis : pourquoi il est juste ou pourquoi il est faux.

#### Scenario: Question à choix multiple
- **GIVEN** une question avec `"expectedAnswers": 2`
- **WHEN** elle est chargée
- **THEN** exactement deux de ses choix ont `"isCorrect": true`

#### Scenario: Explication manquante
- **GIVEN** un choix dont l'explication est vide
- **WHEN** la banque de questions est vérifiée
- **THEN** le choix est signalé comme incomplet

### Requirement: Déclaration des certifications
Chaque certification SHALL être déclarée dans `site/data/certifications.json`, avec un identifiant, un nom court, un nom complet, son fichier de questions et son seuil de réussite s'il est connu. Ajouter une certification MUST NOT demander de modification de code : elle SHALL apparaître automatiquement à l'accueil avec son nombre de questions.

#### Scenario: Ajout d'une certification
- **GIVEN** un nouveau fichier `site/data/questions_psm1.json`
- **WHEN** une entrée `PSM1` est ajoutée à `site/data/certifications.json` avec ce fichier
- **THEN** PSM I apparaît dans la liste de l'accueil avec son nombre de questions

### Requirement: Chargement des questions
Le navigateur SHALL charger une banque de questions au plus une fois par visite, puis la garder en mémoire. Si le fichier est introuvable ou mal formé, l'interface MUST afficher un message d'erreur qui nomme le fichier.

#### Scenario: Fichier manquant
- **GIVEN** une certification déclarée dont le fichier n'existe pas
- **WHEN** l'accueil charge les certifications
- **THEN** un message d'erreur cite le nom du fichier manquant
