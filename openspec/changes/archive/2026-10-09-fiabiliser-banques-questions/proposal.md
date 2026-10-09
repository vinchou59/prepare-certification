## Why

Une relecture complète des 250 questions (PSM II, PSPO I, PSK I, PSM-AI, CCA Agile) a révélé des défauts qui faussent l'entraînement : des bonnes réponses probablement erronées, des explications qui parlent d'une autre question, une banque entière sans explications et des doublons. Une application d'entraînement qui apprend une mauvaise réponse est pire que pas d'application ; ces données doivent être fiabilisées, et protégées contre les régressions.

## What Changes

- Corriger les bonnes réponses douteuses, chacune après validation explicite de l'utilisateur : PSM II #5, #26, #30 ; PSK #14, #33 ; CCA Agile #39.
- Réécrire les explications PSK hors sujet ou génériques (questions 11 à 16 et 18 à 30).
- Rédiger une explication pour chaque choix des 59 questions CCA Agile, en français.
- Corriger les incohérences ponctuelles : PSPO #74 (explications en français, contradiction sur la délégation), PSM II #58 (texte parasite), PSM II #20 et #42 (explications inexactes).
- Supprimer les doublons PSM II (#34, incomplet, doublon de #60 ; #50, doublon de #61).
- Nettoyer les fautes de copie (OCR) et les retours à la ligne parasites dans les textes des choix.
- Renforcer le test de cohérence des banques pour couvrir les nouvelles règles.

## Capabilities

### New Capabilities

_Aucune._

### Modified Capabilities

- `question-bank` : chaque choix doit avoir une explication non vide et propre à ce choix ; pas de question en double dans une banque ; pas de retour à la ligne dans le texte d'un choix.

## Impact

- Données : `psm2-quiz/src/main/resources/questions_psm2.json`, `questions_psk.json`, `questions_pspo1.json`, `questions_psmai.json`, `questions_cca_agile.json`.
- Tests : `QuestionBankConsistencyTest` étendu.
- Aucun changement de code applicatif ni d'interface. Le nombre de questions PSM II passe de 63 à 61.
