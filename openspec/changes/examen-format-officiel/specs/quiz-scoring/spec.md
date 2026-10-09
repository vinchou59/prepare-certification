## MODIFIED Requirements

### Requirement: Seuil de réussite officiel
Chaque certification MAY avoir un seuil de réussite connu, en pourcentage. Lorsqu'il est connu, le système SHALL indiquer si le score atteint ce seuil (score ≥ seuil). Lorsqu'il est inconnu, le système MUST NOT afficher de seuil ni de verdict de réussite.

Seuils actuels : PSM II, PSPO I, PSK I, PSM-AI et CCA Agile à 85 %.

#### Scenario: Seuil atteint
- **GIVEN** un quiz PSPO I de 20 questions
- **WHEN** l'utilisateur obtient 17/20 (85 %)
- **THEN** le résultat indique que le score est au-dessus du seuil de 85 %

#### Scenario: Seuil inconnu
- **GIVEN** une certification déclarée sans seuil de réussite
- **WHEN** un de ses quiz se termine
- **THEN** seuls le score, le pourcentage et la durée sont affichés, sans seuil ni verdict
