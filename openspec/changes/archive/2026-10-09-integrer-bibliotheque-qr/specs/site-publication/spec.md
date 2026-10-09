## MODIFIED Requirements

### Requirement: Partage par QR code
L'accueil SHALL proposer un bouton « Partager » qui affiche l'adresse du site, un bouton pour la copier et un QR code menant à cette adresse. Le QR code SHALL être généré par une bibliothèque incluse dans le site : le partage MUST NOT dépendre d'un service tiers. Si le QR code ne peut pas être généré, l'adresse et le bouton de copie SHALL rester disponibles.

#### Scenario: Partager depuis un ordinateur
- **GIVEN** l'accueil du site ouvert sur un ordinateur
- **WHEN** l'utilisateur clique sur « Partager »
- **THEN** un QR code s'affiche ; en le scannant avec un téléphone, on arrive sur l'accueil du site

#### Scenario: Réseau qui bloque les CDN
- **GIVEN** un réseau qui bloque jsDelivr et cdnjs
- **WHEN** l'utilisateur clique sur « Partager »
- **THEN** le QR code s'affiche quand même, sans requête vers un autre site

#### Scenario: QR code indisponible
- **GIVEN** la bibliothèque de QR code ne peut pas être chargée
- **WHEN** l'utilisateur clique sur « Partager »
- **THEN** l'adresse du site et le bouton « Copier le lien » s'affichent, avec un message indiquant que le QR code est indisponible
