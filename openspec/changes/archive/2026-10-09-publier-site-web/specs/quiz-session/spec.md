## ADDED Requirements

### Requirement: Site web accessible en ligne
L'application SHALL être un site web statique utilisable depuis n'importe quel navigateur récent, sur ordinateur comme sur téléphone, sans installation ni compte. Toute la logique du quiz SHALL s'exécuter dans le navigateur.

#### Scenario: Ouverture sur téléphone
- **GIVEN** l'adresse du site
- **WHEN** quelqu'un l'ouvre sur son téléphone
- **THEN** l'accueil s'affiche, adapté à la largeur de l'écran, et un quiz peut être joué jusqu'au résultat

## MODIFIED Requirements

### Requirement: Confidentialité des réponses
L'interface MUST NOT afficher les bonnes réponses ni les explications d'une question avant sa correction : vérification de la question en mode Entraînement, ou fin du quiz. Les données du site contiennent les réponses ; seule leur présentation est contrôlée.

#### Scenario: Question en cours
- **GIVEN** une question affichée en mode Examen
- **WHEN** l'utilisateur sélectionne des réponses
- **THEN** aucune indication de justesse ni aucune explication n'apparaît avant la fin du quiz

## REMOVED Requirements

### Requirement: Application locale dans le navigateur
**Reason**: L'application n'est plus lancée sur un serveur local ; elle est publiée comme site web (voir « Site web accessible en ligne » et la capability `site-publication`).
**Migration**: Ouvrir l'adresse du site publié. Pour travailler en local, servir le dossier `site/` avec un serveur statique (par exemple `python3 -m http.server`).

### Requirement: Durée de vie des quiz
**Reason**: Sans serveur, aucun quiz n'est conservé en dehors de la page ouverte.
**Migration**: Aucune. Recharger la page pendant un quiz le fait recommencer depuis l'accueil.
