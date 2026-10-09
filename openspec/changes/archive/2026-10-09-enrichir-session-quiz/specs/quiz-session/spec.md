## ADDED Requirements

### Requirement: Marquer une question à revoir
En mode Examen, l'utilisateur SHALL pouvoir marquer et démarquer la question affichée comme « à revoir », qu'il y ait répondu ou non. Les questions marquées SHALL être signalées sur la barre de progression. Le marquage n'a aucun effet sur le score.

#### Scenario: Marquer puis revenir
- **GIVEN** un examen en cours, à la question 4
- **WHEN** l'utilisateur clique sur « Marquer pour revoir » puis passe aux questions suivantes
- **THEN** le segment 4 de la barre de progression porte une marque, et cliquer dessus ramène à la question 4

### Requirement: Ordre des réponses mélangé
Quand le réglage « Mélanger les réponses » est activé, l'ordre des choix de chaque question SHALL être tiré au hasard au lancement du quiz, et les lettres SHALL être réattribuées dans l'ordre affiché (A, B, C…). Les choix de type « All of the above », « None of the above » ou « All answers apply » SHALL rester en dernière position, dans leur ordre d'origine. Les questions dont les choix sont uniquement Vrai/Faux ou True/False MUST NOT être mélangées. Le réglage SHALL être activé par défaut et mémorisé dans le navigateur. Avec le paramètre `seed` dans l'adresse, le mélange SHALL être reproductible.

#### Scenario: Réponses dans un autre ordre
- **GIVEN** le réglage « Mélanger les réponses » activé
- **WHEN** la même question apparaît dans deux quiz successifs
- **THEN** ses choix peuvent apparaître dans un ordre différent, toujours lettrés A, B, C… de haut en bas

#### Scenario: Réponse « All of the answers »
- **GIVEN** une question dont le dernier choix est « All of the answers. »
- **WHEN** elle est affichée avec le mélange activé
- **THEN** « All of the answers. » reste le dernier choix

### Requirement: Signaler une question
Chaque question corrigée SHALL proposer un lien « Signaler un problème » qui ouvre, dans un nouvel onglet, la création d'une issue sur le dépôt GitHub du projet, pré-remplie avec la certification, le numéro de la question et son texte. Le lien MUST NOT dépendre des lettres affichées, qui peuvent varier d'un quiz à l'autre.

#### Scenario: Signaler depuis la correction
- **GIVEN** la correction de la question PSK #17 affichée
- **WHEN** l'utilisateur clique sur « Signaler un problème »
- **THEN** GitHub s'ouvre sur une nouvelle issue dont le titre et le contenu citent PSK I, la question 17 et son texte

## MODIFIED Requirements

### Requirement: Mode Examen
En mode Examen, le système SHALL afficher un chronomètre, permettre de naviguer librement entre les questions et ne montrer aucune correction avant la fin. Si des questions restent sans réponse ou marquées « à revoir » au moment de terminer, le système SHALL prévenir l'utilisateur, en précisant leur nombre, et proposer d'y retourner ou de terminer quand même.

#### Scenario: Terminer avec des questions sans réponse
- **GIVEN** un examen de 10 questions dont 3 sans réponse
- **WHEN** l'utilisateur clique sur « Terminer l'examen »
- **THEN** un avertissement indique que 3 questions compteront comme fausses, avec les choix « Y retourner » et « Terminer quand même »

#### Scenario: Terminer avec des questions marquées
- **GIVEN** un examen dont toutes les questions ont une réponse, dont 2 marquées à revoir
- **WHEN** l'utilisateur clique sur « Terminer l'examen »
- **THEN** un avertissement indique que 2 questions sont marquées à revoir ; « Y retourner » mène à la première d'entre elles
