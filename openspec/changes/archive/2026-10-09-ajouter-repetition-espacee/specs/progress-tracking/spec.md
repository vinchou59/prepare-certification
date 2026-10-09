## ADDED Requirements

### Requirement: Niveau de maîtrise par question
Le système SHALL déduire de l'historique une boîte de 1 à 5 pour chaque question déjà vue : une bonne réponse SHALL la faire monter d'une boîte (boîte 2 si elle est réussie dès sa première apparition), une erreur SHALL la renvoyer en boîte 1. Une question SHALL être à réviser lorsque le délai de sa boîte est écoulé depuis sa dernière réponse : immédiatement en boîte 1, puis 1, 3, 7 et 14 jours pour les boîtes 2 à 5. Une question en boîte 4 ou 5 SHALL être considérée comme maîtrisée.

#### Scenario: Erreur après plusieurs réussites
- **GIVEN** une question réussie trois fois de suite, donc en boîte 4
- **WHEN** l'utilisateur se trompe sur cette question
- **THEN** elle revient en boîte 1 et est à réviser immédiatement

### Requirement: Bilan de progression
Dès qu'au moins une question de la certification choisie a été vue, l'accueil SHALL afficher la répartition de ses questions entre maîtrisées, en cours, à revoir et jamais vues, ainsi que le nombre de questions à réviser maintenant.

#### Scenario: Premier quiz terminé
- **GIVEN** un premier entraînement PSM II de 5 questions avec 2 bonnes réponses
- **WHEN** l'utilisateur revient à l'accueil
- **THEN** « Ma progression PSM II » indique 0 maîtrisée, 2 en cours, 3 à revoir, 56 jamais vues et 3 questions à réviser
