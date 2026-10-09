# Site Publication Specification

## Purpose
Mettre le quiz à disposition de n'importe qui, sans installation, à une adresse publique stable, et permettre de la partager facilement par lien ou par QR code.

## Requirements

### Requirement: Publication automatique
Le site SHALL être publié sur GitHub Pages à chaque push sur la branche `main`. La publication MUST NOT avoir lieu si les tests automatisés échouent ; le site déjà en ligne reste alors inchangé.

#### Scenario: Push avec tests au vert
- **GIVEN** un commit sur `main` dont tous les tests passent
- **WHEN** il est poussé sur GitHub
- **THEN** la nouvelle version du site est en ligne quelques minutes plus tard

#### Scenario: Push avec un test en échec
- **GIVEN** un commit sur `main` qui introduit une question incohérente
- **WHEN** il est poussé sur GitHub
- **THEN** le test de cohérence échoue, la publication est annulée et l'ancienne version reste en ligne

### Requirement: Partage par QR code
L'accueil SHALL proposer un bouton « Partager » qui affiche l'adresse du site, un bouton pour la copier et un QR code menant à cette adresse. Si le QR code ne peut pas être généré, l'adresse et le bouton de copie SHALL rester disponibles.

#### Scenario: Partager depuis un ordinateur
- **GIVEN** l'accueil du site ouvert sur un ordinateur
- **WHEN** l'utilisateur clique sur « Partager »
- **THEN** un QR code s'affiche ; en le scannant avec un téléphone, on arrive sur l'accueil du site

#### Scenario: QR code indisponible
- **GIVEN** la bibliothèque de QR code ne peut pas être chargée
- **WHEN** l'utilisateur clique sur « Partager »
- **THEN** l'adresse du site et le bouton « Copier le lien » s'affichent, avec un message indiquant que le QR code est indisponible
