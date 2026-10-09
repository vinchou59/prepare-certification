## ADDED Requirements

### Requirement: Choix indépendants de leur lettre
Comme l'ordre des choix peut être mélangé, les textes et les explications des choix MUST NOT désigner un autre choix par sa lettre (par exemple « option B »). Ils SHALL le désigner par son contenu.

#### Scenario: Référence à une lettre
- **GIVEN** une explication qui contient « Because option B is correct »
- **WHEN** la banque de questions est vérifiée
- **THEN** le choix est signalé comme dépendant de l'ordre des réponses
