# Progress Tracking Specification

## Purpose
Garder la trace des quiz joués sur un appareil, pour mesurer sa progression par certification et retravailler les questions ratées.

## Requirements

### Requirement: Historique des quiz
Chaque quiz terminé SHALL être enregistré dans le stockage local du navigateur avec sa date, sa certification, son mode, son score, son nombre de questions, son pourcentage, sa durée et le résultat (juste ou faux) de chaque question. L'historique SHALL conserver au plus les 200 quiz les plus récents. Un quiz abandonné MUST NOT être enregistré.

#### Scenario: Quiz terminé
- **GIVEN** un quiz PSK I de 10 questions terminé avec 7 bonnes réponses
- **WHEN** le résultat s'affiche
- **THEN** l'historique contient une nouvelle entrée PSK I à 7/10 (70 %)

#### Scenario: Quiz abandonné
- **GIVEN** un quiz en cours
- **WHEN** l'utilisateur clique sur « Abandonner »
- **THEN** l'historique est inchangé

### Requirement: Questions à retravailler
Pour chaque certification, le système SHALL tenir la liste des questions dont la dernière réponse enregistrée est fausse. Une question ratée, y compris sans réponse, SHALL entrer dans la liste ; une question réussie SHALL en sortir. Les questions qui n'existent plus dans la banque MUST être ignorées.

#### Scenario: Question ratée puis réussie
- **GIVEN** la question PSK #14 ratée lors d'un quiz
- **WHEN** elle est réussie lors d'un quiz suivant
- **THEN** elle ne fait plus partie des questions à retravailler en PSK I

### Requirement: Retravailler ses erreurs depuis l'accueil
Quand la certification choisie a des questions à retravailler, l'accueil SHALL afficher leur nombre et un bouton « Retravailler mes erreurs » qui lance un quiz composé de ces questions, dans un ordre aléatoire, avec le mode choisi.

#### Scenario: Lancer une révision des erreurs
- **GIVEN** 6 questions à retravailler en PSPO I et le mode Entraînement choisi
- **WHEN** l'utilisateur clique sur « Retravailler mes erreurs »
- **THEN** un quiz de 6 questions en mode Entraînement démarre avec ces questions

### Requirement: Derniers résultats
L'accueil SHALL afficher, pour la certification choisie, les derniers résultats (au plus 10), du plus récent au plus ancien, avec la date, le mode, le score et le pourcentage, ainsi que le seuil de réussite s'il est connu. Sans quiz enregistré pour cette certification, cette section MUST NOT s'afficher.

#### Scenario: Résultats affichés
- **GIVEN** 3 quiz PSM II terminés
- **WHEN** PSM II est sélectionnée à l'accueil
- **THEN** les 3 résultats s'affichent, le plus récent en premier, chacun situé par rapport au seuil de 85 %

### Requirement: Effacer l'historique
L'utilisateur SHALL pouvoir effacer son historique et ses questions à retravailler, toutes certifications confondues, après une confirmation affichée dans la page.

#### Scenario: Effacement confirmé
- **GIVEN** un historique non vide
- **WHEN** l'utilisateur clique sur « Effacer mon historique » puis confirme
- **THEN** l'historique et les questions à retravailler sont vides et la section des derniers résultats disparaît

### Requirement: Données locales uniquement
L'historique SHALL rester dans le navigateur de l'appareil utilisé et MUST NOT être envoyé à un serveur. Si le stockage local est indisponible, le quiz SHALL fonctionner normalement, sans historique.

#### Scenario: Stockage indisponible
- **GIVEN** un navigateur en navigation privée qui refuse le stockage local
- **WHEN** l'utilisateur termine un quiz
- **THEN** le résultat s'affiche normalement, sans message d'erreur

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
