## ADDED Requirements

### Requirement: Points faibles par thème
L'accueil SHALL afficher, pour la certification choisie, le taux de réussite de chaque thème déjà travaillé, calculé sur le dernier résultat enregistré de chaque question vue du thème, classés du plus faible au plus solide. Un taux sous le seuil de réussite SHALL être signalé. Chaque thème SHALL proposer un bouton « S'entraîner » qui lance un quiz Entraînement sur ce thème. Les thèmes jamais travaillés MUST NOT figurer dans ce classement.

#### Scenario: Thème faible en premier
- **GIVEN** en PSM II, 6 questions « Organisation » réussies sur 14 vues et 3 sur 3 en « Théorie »
- **WHEN** l'utilisateur ouvre l'accueil
- **THEN** « Organisation » apparaît avant « Théorie », avec 43 % signalé sous le seuil de 85 %

#### Scenario: S'entraîner sur un thème faible
- **GIVEN** le thème « Organisation » affiché dans les points faibles
- **WHEN** l'utilisateur clique sur « S'entraîner »
- **THEN** un quiz Entraînement démarre avec uniquement des questions de ce thème
