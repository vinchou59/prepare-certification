## Context

Les banques comptent 248 questions réparties sur 5 certifications de nature différente (Scrum, Kanban, coaching agile en français, IA). L'historique stocke déjà le résultat de chaque question.

## Decisions

- **Thèmes propres à chaque certification**, déclarés dans `certifications.json` : un même référentiel ne conviendrait pas à PSK et à CCA. Les certifications Scrum partagent un socle (théorie et valeurs, équipe, événements, artefacts, Product Owner et valeur, organisation et passage à l'échelle) ; PSM II y ajoute la posture du Scrum Master.
- **Un seul thème par question**, le thème dominant. Plusieurs thèmes compliqueraient le calcul des taux sans réel gain.
- **Classement initial fait par Claude** à la demande de l'auteur, modifiable simplement en changeant la ligne `theme` de la question.
- **Taux par thème = dernier résultat de chaque question vue**, cohérent avec la liste des questions à retravailler : une question ratée puis réussie compte comme réussie.
- **Filtre réservé à l'Entraînement** : l'examen blanc garde le format officiel, tous thèmes confondus. « Retravailler mes erreurs » ignore aussi le filtre.
- **Tests** : chaque question doit avoir un thème déclaré pour sa certification, et chaque thème déclaré doit avoir au moins une question.
