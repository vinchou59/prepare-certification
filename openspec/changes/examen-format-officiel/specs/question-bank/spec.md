## MODIFIED Requirements

### Requirement: Déclaration des certifications
Chaque certification SHALL être déclarée dans `site/data/certifications.json`, avec un identifiant, un nom court, un nom complet, son fichier de questions, son seuil de réussite s'il est connu et le format de son examen officiel (`exam` : nombre de questions et durée en minutes). Ajouter une certification MUST NOT demander de modification de code : elle SHALL apparaître automatiquement à l'accueil avec son nombre de questions.

#### Scenario: Ajout d'une certification
- **GIVEN** un nouveau fichier `site/data/questions_psm1.json`
- **WHEN** une entrée `PSM1` est ajoutée à `site/data/certifications.json` avec ce fichier et `"exam": { "questions": 80, "minutes": 60 }`
- **THEN** PSM I apparaît dans la liste de l'accueil avec son nombre de questions, et son examen dure 60 minutes

#### Scenario: Format d'examen invalide
- **GIVEN** une certification déclarée sans `exam`, ou avec un nombre de questions ou une durée nuls
- **WHEN** les données sont vérifiées
- **THEN** la déclaration est signalée comme invalide
