## 1. Données

- [x] 1.1 Déclarer les thèmes de chaque certification dans `certifications.json`. Vérification : test de cohérence.
- [x] 1.2 Attribuer un thème à chacune des 248 questions, sans modifier les questions. Vérification : test « thème déclaré pour chaque question, aucune question sans thème ».

## 2. Logique

- [x] 2.1 `filterByTheme`, `themeStats`, `weakThemes` dans `quiz-core.js`, et thème transmis par `questionView` et dans la correction. Vérification : `tests/themes.test.mjs`.

## 3. Interface

- [x] 3.1 Choix du thème en Entraînement, mémorisé. Vérification : un quiz « Événements » ne contient que des questions de ce thème.
- [x] 3.2 Points faibles par thème et bouton « S'entraîner ». Vérification : parcours navigateur, mobile et mode sombre.
- [x] 3.3 Thème affiché pendant le quiz et dans la correction. Vérification : parcours navigateur.

## 4. Finalisation

- [x] 4.1 Mettre à jour le README. Vérification : relecture.
