# Quiz Session Specification

## Purpose
Déroulé d'un quiz sur le site : réglages, réponse aux questions dans les modes Entraînement et Examen, correction et résultats. Couvre l'interface (`site/js/app.js`).

## Requirements

### Requirement: Réglages du quiz
L'accueil SHALL permettre de choisir la certification (avec son nombre de questions disponibles), le nombre de questions (5, 10, 20 ou toutes) et le mode (Entraînement ou Examen). Les derniers réglages SHOULD être mémorisés dans le navigateur et proposés au prochain lancement.

#### Scenario: Réglages mémorisés
- **GIVEN** un premier quiz lancé en PSK I, 20 questions, mode Examen
- **WHEN** l'utilisateur revient à l'accueil plus tard dans le même navigateur
- **THEN** PSK I, 20 et Examen sont présélectionnés

### Requirement: Sélection des réponses
Chaque question SHALL indiquer combien de réponses sont attendues. Pour une question à une seule réponse, choisir une lettre SHALL remplacer la précédente. Pour une question à N réponses, l'utilisateur MUST NOT pouvoir en sélectionner plus de N : choisir une lettre de plus SHALL désélectionner la plus ancienne. Les lettres du clavier SHALL (dé)sélectionner les réponses correspondantes.

#### Scenario: Limite de sélection
- **GIVEN** une question qui attend 2 réponses, avec A et B déjà sélectionnées
- **WHEN** l'utilisateur appuie sur la touche C
- **THEN** B et C sont sélectionnées

### Requirement: Mode Entraînement
En mode Entraînement, la correction d'une question SHALL n'être disponible que lorsque le nombre de réponses attendu est sélectionné. Après correction, la question SHALL être verrouillée et afficher, pour chaque choix, s'il est juste ou faux, le choix de l'utilisateur et l'explication. L'utilisateur MAY revenir sur les questions déjà corrigées, mais MUST NOT pouvoir aller au-delà de la première question non corrigée.

#### Scenario: Vérifier une réponse
- **GIVEN** une question à une réponse, en mode Entraînement, avec la réponse A sélectionnée
- **WHEN** l'utilisateur appuie sur Entrée
- **THEN** la question est corrigée, les bonnes réponses apparaissent en vert, un mauvais choix en rouge, avec les explications, et la barre de progression prend la couleur du résultat

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

### Requirement: Résultats et correction
À la fin d'un quiz, le système SHALL afficher le score, le pourcentage, la durée, le seuil de réussite s'il est connu, puis la correction détaillée de chaque question. La correction SHALL être filtrable entre les erreurs seulement et toutes les questions ; le filtre par défaut SHALL être les erreurs, sauf en cas de sans-faute. L'utilisateur SHALL pouvoir relancer un quiz avec les mêmes réglages, retravailler les questions ratées de ce quiz, ou revenir à l'accueil.

#### Scenario: Sans-faute
- **GIVEN** un quiz terminé sans aucune erreur
- **WHEN** le résultat s'affiche
- **THEN** la correction montre toutes les questions avec leurs explications, et aucun bouton pour retravailler les erreurs n'est proposé

#### Scenario: Retravailler les erreurs du quiz
- **GIVEN** un quiz de 10 questions terminé avec 3 erreurs
- **WHEN** l'utilisateur clique sur « Retravailler ces erreurs »
- **THEN** un quiz de 3 questions démarre avec ces questions, dans le même mode

### Requirement: Confidentialité des réponses
L'interface MUST NOT afficher les bonnes réponses ni les explications d'une question avant sa correction : vérification de la question en mode Entraînement, ou fin du quiz. Les données du site contiennent les réponses ; seule leur présentation est contrôlée.

#### Scenario: Question en cours
- **GIVEN** une question affichée en mode Examen
- **WHEN** l'utilisateur sélectionne des réponses
- **THEN** aucune indication de justesse ni aucune explication n'apparaît avant la fin du quiz

### Requirement: Site web accessible en ligne
L'application SHALL être un site web statique utilisable depuis n'importe quel navigateur récent, sur ordinateur comme sur téléphone, sans installation ni compte. Toute la logique du quiz SHALL s'exécuter dans le navigateur.

#### Scenario: Ouverture sur téléphone
- **GIVEN** l'adresse du site
- **WHEN** quelqu'un l'ouvre sur son téléphone
- **THEN** l'accueil s'affiche, adapté à la largeur de l'écran, et un quiz peut être joué jusqu'au résultat

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
