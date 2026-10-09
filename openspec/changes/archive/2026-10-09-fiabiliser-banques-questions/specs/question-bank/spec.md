## MODIFIED Requirements

### Requirement: Un fichier JSON par certification
Chaque certification SHALL avoir son fichier `src/main/resources/questions_<certif>.json`, de la forme `{"questions": [...]}`. Chaque question SHALL avoir un `id` entier unique dans le fichier, un texte `question`, un nombre `expectedAnswers` et une liste `choices`. Chaque choix SHALL avoir une lettre `label` (A, B, C… dans l'ordre), un `text`, un booléen `isCorrect` et une `explanation` non vide, qui justifie ce choix précis : pourquoi il est juste ou pourquoi il est faux.

#### Scenario: Question à choix multiple
- **GIVEN** une question avec `"expectedAnswers": 2`
- **WHEN** elle est chargée
- **THEN** exactement deux de ses choix ont `"isCorrect": true`

#### Scenario: Explication manquante
- **GIVEN** un choix dont l'explication est vide
- **WHEN** la banque de questions est vérifiée
- **THEN** le choix est signalé comme incomplet

## ADDED Requirements

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
