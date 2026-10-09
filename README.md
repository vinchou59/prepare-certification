# prepare-certification
Permet de s'entrainter aux différentes certifications (PSM, PSPO, PSK, ...)

Le lancement de l'application nécessite Java 25 ou ultérieur (via `JAVA_HOME` ou `PATH`).

## Lancer le quiz

```bash
cd psm2-quiz
mvn package          # construit target/psm2-quiz-1.0-SNAPSHOT-jar-with-dependencies.jar
./launch_quiz.command
```

L'application démarre un petit serveur local (uniquement accessible depuis votre machine) et ouvre
l'interface dans votre navigateur, par défaut sur http://localhost:8765/.
Pour l'arrêter : bouton « Quitter l'application » sur l'accueil, ou Ctrl+C dans le terminal.

Deux modes de travail :
- **Entraînement** : correction et explications après chaque question.
- **Examen** : chronomètre, navigation libre entre les questions, correction complète à la fin.

Raccourcis clavier pendant le quiz : les lettres (A, B, C…) pour répondre, Entrée pour valider,
flèches gauche/droite pour naviguer.

Options (propriétés système, à passer avant `-jar`) :

| Option | Effet |
| --- | --- |
| `-Dquiz.port=9000` | Port préféré (un port libre est pris s'il est occupé) |
| `-Dquiz.noBrowser=true` | N'ouvre pas le navigateur automatiquement |
| `-Dquiz.seed=42` | Tirage des questions reproductible |

## Ajouter des questions

Les questions sont dans `psm2-quiz/src/main/resources/questions_*.json`. Pour une nouvelle
certification, ajoutez le fichier puis une entrée dans `domain/model/Certification.java`.
