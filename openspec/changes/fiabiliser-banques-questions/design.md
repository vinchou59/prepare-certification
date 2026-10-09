## Context

Les banques de questions viennent de sources hétérogènes (copies de PDF, OCR, génération assistée). La relecture a montré trois familles de défauts : bonnes réponses discutables, explications désalignées ou absentes, problèmes de forme. Seul le premier change ce que l'utilisateur apprend ; c'est aussi le seul qui demande un arbitrage humain.

## Goals / Non-Goals

**Goals:**
- Aucune bonne réponse modifiée sans validation explicite de l'utilisateur.
- Chaque choix de chaque question a une explication propre, dans la langue de sa banque.
- Les règles de cohérence sont vérifiées automatiquement par un test, pour éviter les régressions.

**Non-Goals:**
- Ajouter de nouvelles questions ou certifications.
- Modifier l'application ou l'interface.
- Réviser le fond des questions jugées correctes à la relecture.

## Decisions

- **Validation question par question pour les bonnes réponses.** Chaque correction est présentée avec la question, les choix, le raisonnement et un niveau de confiance ; l'utilisateur valide ou rejette. Alternative écartée : corriger d'office, trop risqué pour un contenu d'examen.
- **Éditions ciblées des fichiers JSON plutôt que réécriture complète.** Les fichiers sont modifiés bloc par bloc pour garder un diff lisible dans git. Alternative écartée : recharger et réécrire tout le JSON, qui changerait la mise en forme de chaque ligne.
- **Suppression des doublons en gardant la version complète.** PSM II #34 est supprimée au profit de #60, qui a la mise en situation ; #50 est supprimée au profit de #61. Les `id` restants ne sont pas renumérotés, rien ne dépend de leur continuité.
- **Le test de cohérence est étendu au fil des étapes.** Chaque nouvelle règle n'est activée dans le test qu'une fois les données de l'étape correspondante corrigées, pour que la suite de tests reste verte à chaque commit.

## Risks / Trade-offs

- [Une correction de bonne réponse validée reste erronée] → Indiquer le niveau de confiance et inviter à vérifier sur une source officielle (Scrum.org Open Assessments) avant de valider.
- [Explications rédigées trop génériques] → Chaque explication cite l'élément propre au choix (règle du Scrum Guide, du Kanban Guide ou principe agile concerné).
- [Volume de l'étape CCA, 59 questions et environ 220 explications] → La traiter par lots de 15 questions, chacun relu par l'utilisateur.

## Migration Plan

Aucune migration : les données sont relues au lancement de l'application. Le jar est reconstruit automatiquement par `launch_quiz.command` quand les ressources changent.

## Open Questions

_Aucune._
