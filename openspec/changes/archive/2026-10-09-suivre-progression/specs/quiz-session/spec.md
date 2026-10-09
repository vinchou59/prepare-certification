## MODIFIED Requirements

### Requirement: Résultats et correction
À la fin d'un quiz, le système SHALL afficher le score, le pourcentage, la durée, le seuil de réussite s'il est connu, puis la correction détaillée de chaque question. La correction SHALL être filtrable entre les erreurs seulement et toutes les questions ; le filtre par défaut SHALL être les erreurs, sauf en cas de sans-faute. L'utilisateur SHALL pouvoir relancer un quiz avec les mêmes réglages, retravailler les questions ratées de ce quiz, ou revenir à l'accueil.

#### Scenario: Sans-faute
- **GIVEN** un quiz terminé sans aucune erreur
- **WHEN** le résultat s'affiche
- **THEN** la correction montre toutes les questions avec leurs explications, et aucun bouton pour retravailler les erreurs n'est proposé

#### Scenario: Retravailler les erreurs du quiz
- **GIVEN** un quiz de 10 questions terminé avec 3 erreurs
- **WHEN** l'utilisateur clique sur « Retravailler ces erreurs »
- **THEN** un quiz de 3 questions démarre avec ces questions, dans le même mode
