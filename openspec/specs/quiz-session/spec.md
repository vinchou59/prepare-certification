# Quiz Session Specification

## Purpose
Déroulé d'un quiz dans l'interface web locale : lancement de l'application, réglages, réponse aux questions dans les modes Entraînement et Examen, correction et résultats. Couvre le serveur (`application/web`) et le front-end (`src/main/resources/web`).

## Requirements

### Requirement: Application locale dans le navigateur
Le lanceur SHALL démarrer un serveur HTTP qui écoute uniquement sur l'interface locale (loopback), puis ouvrir l'interface dans le navigateur par défaut. Le port préféré SHALL être 8765, modifiable par `-Dquiz.port` ; s'il est occupé, le serveur SHALL utiliser un port libre. L'ouverture du navigateur SHALL pouvoir être désactivée par `-Dquiz.noBrowser=true`.

#### Scenario: Lancement standard
- **GIVEN** le port 8765 libre
- **WHEN** l'utilisateur lance `launch_quiz.command`
- **THEN** le navigateur s'ouvre sur http://localhost:8765/ et affiche l'accueil

#### Scenario: Arrêt depuis l'interface
- **GIVEN** l'application lancée
- **WHEN** l'utilisateur clique sur « Quitter l'application » depuis l'accueil
- **THEN** le serveur s'arrête et la page indique que l'onglet peut être fermé

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
En mode Examen, le système SHALL afficher un chronomètre, permettre de naviguer librement entre les questions et ne montrer aucune correction avant la fin. Si des questions restent sans réponse au moment de terminer, le système SHALL prévenir l'utilisateur et proposer d'y retourner ou de terminer quand même.

#### Scenario: Terminer avec des questions sans réponse
- **GIVEN** un examen de 10 questions dont 3 sans réponse
- **WHEN** l'utilisateur clique sur « Terminer l'examen »
- **THEN** un avertissement indique que 3 questions compteront comme fausses, avec les choix « Y retourner » et « Terminer quand même »

### Requirement: Résultats et correction
À la fin d'un quiz, le système SHALL afficher le score, le pourcentage, la durée, le seuil de réussite s'il est connu, puis la correction détaillée de chaque question. La correction SHALL être filtrable entre les erreurs seulement et toutes les questions ; le filtre par défaut SHALL être les erreurs, sauf en cas de sans-faute. L'utilisateur SHALL pouvoir relancer un quiz avec les mêmes réglages ou revenir à l'accueil.

#### Scenario: Sans-faute
- **GIVEN** un quiz terminé sans aucune erreur
- **WHEN** le résultat s'affiche
- **THEN** la correction montre toutes les questions avec leurs explications

### Requirement: Confidentialité des réponses
Le serveur MUST NOT envoyer au navigateur les bonnes réponses ni les explications d'une question avant sa correction : vérification de la question en mode Entraînement, ou fin du quiz.

#### Scenario: Lancement d'un quiz
- **GIVEN** une certification choisie
- **WHEN** le navigateur demande un nouveau quiz
- **THEN** la réponse ne contient, pour chaque choix, que sa lettre et son texte

### Requirement: Durée de vie des quiz
Le serveur SHALL garder en mémoire au plus les 50 quiz les plus récents. Une action sur un quiz inconnu ou expiré SHALL renvoyer une erreur explicite invitant à relancer un quiz depuis l'accueil.

#### Scenario: Quiz expiré
- **GIVEN** un quiz qui n'est plus en mémoire, par exemple après un redémarrage de l'application
- **WHEN** l'utilisateur tente de terminer ce quiz
- **THEN** l'interface affiche « Ce quiz n'existe plus. Relancez-en un depuis l'accueil. »
