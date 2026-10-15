## ADDED Requirements

### Requirement: Choix de l'apparence
L'accueil SHALL proposer un réglage « Apparence » avec trois choix : Automatique, Clair et Sombre. Automatique SHALL suivre le thème clair ou sombre du système et SHALL être le choix par défaut. Clair et Sombre SHALL imposer le thème correspondant sur tous les écrans du site, quel que soit le thème du système. Le choix SHOULD être mémorisé dans le navigateur et MUST être appliqué dès le chargement de la page, avant le premier affichage.

#### Scenario: Forcer le mode clair
- **GIVEN** un appareil réglé en mode sombre
- **WHEN** l'utilisateur choisit « Clair » dans le réglage Apparence
- **THEN** le site s'affiche immédiatement en clair, y compris pendant les quiz

#### Scenario: Choix mémorisé
- **GIVEN** l'apparence « Clair » choisie lors d'une visite précédente, sur un appareil en mode sombre
- **WHEN** l'utilisateur rouvre le site
- **THEN** la page s'affiche directement en clair, sans passage par le thème sombre

#### Scenario: Retour au thème du système
- **GIVEN** l'apparence « Sombre » choisie sur un appareil en mode clair
- **WHEN** l'utilisateur choisit « Automatique »
- **THEN** le site repasse en clair, comme le système
