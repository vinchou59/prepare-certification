## MODIFIED Requirements

### Requirement: Déclaration des certifications
Chaque certification SHALL être déclarée dans `site/data/certifications.json`, avec un identifiant, un nom court, un nom complet, son fichier de questions, son seuil de réussite s'il est connu, le format de son examen officiel (`exam` : nombre de questions et durée en minutes) et la liste de ses thèmes (`themes` : identifiant et libellé). Ajouter une certification MUST NOT demander de modification de code : elle SHALL apparaître automatiquement à l'accueil avec son nombre de questions.

#### Scenario: Ajout d'une certification
- **GIVEN** un nouveau fichier `site/data/questions_psm1.json`
- **WHEN** une entrée `PSM1` est ajoutée à `site/data/certifications.json` avec ce fichier, `"exam": { "questions": 80, "minutes": 60 }` et ses thèmes
- **THEN** PSM I apparaît dans la liste de l'accueil avec son nombre de questions, et son examen dure 60 minutes

#### Scenario: Format d'examen invalide
- **GIVEN** une certification déclarée sans `exam`, ou avec un nombre de questions ou une durée nuls
- **WHEN** les données sont vérifiées
- **THEN** la déclaration est signalée comme invalide

## ADDED Requirements

### Requirement: Thème de chaque question
Chaque question SHALL porter un champ `theme` égal à l'identifiant d'un thème déclaré pour sa certification. Chaque thème déclaré SHALL être utilisé par au moins une question.

#### Scenario: Thème inconnu
- **GIVEN** une question PSK dont le thème est « evenement » alors que PSK déclare « evenements »
- **WHEN** les données sont vérifiées
- **THEN** la question est signalée comme ayant un thème absent de `certifications.json`

#### Scenario: Thème inutilisé
- **GIVEN** un thème déclaré pour une certification qu'aucune question n'utilise
- **WHEN** les données sont vérifiées
- **THEN** le thème est signalé comme sans question
