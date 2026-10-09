## Context

`createQuiz` tire `size` questions ; le mode Examen n'a aujourd'hui qu'un chronomètre croissant (`setInterval` dans `app.js`) et utilise le nombre de questions choisi à l'accueil.

## Goals / Non-Goals

**Goals:**
- Examen blanc fidèle : format officiel, compte à rebours, fin automatique.
- Accueil qui ne montre que les réglages utiles au mode choisi.

**Non-Goals:**
- Points partiels (PSM II en accorde sur certaines questions) : le score reste « juste ou faux ».
- Pause ou reprise d'un examen après rechargement de la page.

## Decisions

- **Format dans les données** : `exam: { questions, minutes }` dans `certifications.json`, source unique pour l'accueil et le quiz.
- **`examFormat(exam, available)`** dans `quiz-core.js` (fonction pure, testée) : `questions = min(exam.questions, available)`, `minutes = max(1, round(exam.minutes × questions / exam.questions))`, `prorated` vrai si la banque est plus petite. Le même calcul sert au quiz d'erreurs en mode Examen, avec `available` = nombre de questions à retravailler.
- **Compte à rebours sur l'heure de fin** : l'échéance est `startedAt + minutes × 60 s` ; l'affichage se recalcule chaque seconde à partir de l'horloge, donc il reste juste même si l'onglet a été mis en arrière-plan. À zéro, `finishQuiz(force)` termine sans avertissement et l'écran de résultat affiche « Temps écoulé ».
- **Dernière minute** : le compte à rebours passe en couleur d'alerte et son libellé accessible est mis à jour ; pas de son ni d'animation.
- **Accueil** : ordre Certification → Mode → (Nombre de questions | Format d'examen) → Ordre des réponses. Le réglage « nombre de questions » reste mémorisé pour l'entraînement.

## Risks / Trade-offs

- [Onglet en veille sur mobile : le minuteur JavaScript est suspendu] → L'échéance est recalculée à partir de l'horloge au réveil ; si elle est dépassée, le quiz se termine immédiatement.
- [Format officiel modifié par l'organisme] → Une seule ligne à changer dans `certifications.json`.

## Migration Plan

Aucune : le format manquant est une erreur détectée par les tests avant publication.

## Open Questions

_Aucune._
