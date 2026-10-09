## 1. Mélange des réponses

- [x] 1.1 `quiz-core.js` : mélanger et relettrer les choix dans `createQuiz` (option `shuffleChoices`), choix ancrés en fin de liste, Vrai/Faux inchangés. Vérification : tests Node.js (ordre reproductible, ancrage, Vrai/Faux, correction juste après relettrage).
- [x] 1.2 Corriger l'explication PSK #36 D et ajouter la règle « pas de lettre citée » au test de cohérence. Vérification : `npm test`.
- [x] 1.3 Accueil : réglage « Mélanger les réponses », activé par défaut et mémorisé. Vérification : parcours navigateur.

## 2. Marquage en mode Examen

- [x] 2.1 Bouton « Marquer pour revoir » / « Retirer la marque », marque sur la barre de progression, avertissement de fin incluant les questions marquées. Vérification : parcours navigateur, mobile.

## 3. Signalement

- [x] 3.1 Lien « Signaler un problème » sous chaque correction (Entraînement et résultat), vers une issue GitHub pré-remplie sans lettres. Vérification : adresse générée contrôlée dans un test navigateur.

## 4. Finalisation

- [x] 4.1 Mettre à jour le README. Vérification : relecture.
