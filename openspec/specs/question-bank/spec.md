# Question Bank Specification

## Purpose
Format et chargement des banques de questions par certification, et procédure pour en ajouter une.

## Requirements

### Requirement: Un fichier JSON par certification
Chaque certification SHALL avoir son fichier `src/main/resources/questions_<certif>.json`, de la forme `{"questions": [...]}`. Chaque question SHALL avoir un `id` entier unique dans le fichier, un texte `question`, un nombre `expectedAnswers` et une liste `choices`. Chaque choix SHALL avoir une lettre `label` (A, B, C… dans l'ordre), un `text`, un booléen `isCorrect` et une `explanation`, qui MAY être vide.

#### Scenario: Question à choix multiple
- **GIVEN** une question avec `"expectedAnswers": 2`
- **WHEN** elle est chargée
- **THEN** exactement deux de ses choix ont `"isCorrect": true`

### Requirement: Cohérence des réponses attendues
Pour chaque question, `expectedAnswers` MUST être égal au nombre de choix marqués `isCorrect`. Sinon, la question ne peut jamais être réussie.

#### Scenario: Incohérence détectée
- **GIVEN** une question avec `"expectedAnswers": 2` et un seul choix correct
- **WHEN** la banque de questions est vérifiée
- **THEN** la question est signalée comme incohérente

### Requirement: Langue et mise en forme des questions
Les textes des questions et des choix SHALL rester dans la langue de l'examen officiel : en anglais pour les certifications Scrum.org (PSM II, PSPO I, PSK I, PSM-AI), en français pour CCA Agile. Les retours à la ligne (`\n`) dans les textes SHALL être conservés à l'affichage.

#### Scenario: Consigne sur une seconde ligne
- **GIVEN** une question dont le texte se termine par `\n(choose the best two answers)`
- **WHEN** elle est affichée
- **THEN** la consigne apparaît sur sa propre ligne

### Requirement: Déclaration des certifications
Chaque certification SHALL être déclarée dans l'énumération `Certification`, avec un nom court, un nom complet, son fichier de questions et son seuil de réussite s'il est connu. Ajouter une certification MUST NOT demander d'autre modification de code : elle SHALL apparaître automatiquement à l'accueil avec son nombre de questions.

#### Scenario: Ajout d'une certification
- **GIVEN** un nouveau fichier `questions_psm1.json`
- **WHEN** une entrée `PSM1` est ajoutée à `Certification` avec ce fichier
- **THEN** PSM I apparaît dans la liste de l'accueil avec son nombre de questions

### Requirement: Chargement des questions
Une banque de questions SHALL être lue une seule fois par lancement de l'application, puis gardée en mémoire. Si le fichier est introuvable ou mal formé, le chargement MUST échouer avec un message qui nomme le fichier.

#### Scenario: Fichier manquant
- **GIVEN** une certification déclarée dont le fichier n'existe pas
- **WHEN** ses questions sont chargées
- **THEN** une erreur indique « Resource not found » suivi du nom du fichier
