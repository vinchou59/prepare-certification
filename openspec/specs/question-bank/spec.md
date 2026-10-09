# Question Bank Specification

## Purpose
Format et chargement des banques de questions par certification, et procédure pour en ajouter une.

## Requirements

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

### Requirement: Pas de question en double
Une banque de questions MUST NOT contenir deux fois la même question. Deux questions sont considérées comme identiques si leurs textes sont égaux, sans tenir compte de la casse ni des espaces.

#### Scenario: Doublon détecté
- **GIVEN** une banque où deux questions ont le même texte
- **WHEN** la banque de questions est vérifiée
- **THEN** la seconde occurrence est signalée comme doublon

### Requirement: Texte des choix sur une seule ligne
Le texte d'un choix MUST NOT contenir de retour à la ligne, afin qu'il s'affiche comme une phrase continue. Le texte d'une question MAY en contenir, par exemple pour isoler la consigne.

#### Scenario: Retour à la ligne parasite
- **GIVEN** un choix dont le texte contient `\n`
- **WHEN** la banque de questions est vérifiée
- **THEN** le choix est signalé comme mal formaté

### Requirement: Choix indépendants de leur lettre
Comme l'ordre des choix peut être mélangé, les textes et les explications des choix MUST NOT désigner un autre choix par sa lettre (par exemple « option B »). Ils SHALL le désigner par son contenu.

#### Scenario: Référence à une lettre
- **GIVEN** une explication qui contient « Because option B is correct »
- **WHEN** la banque de questions est vérifiée
- **THEN** le choix est signalé comme dépendant de l'ordre des réponses
