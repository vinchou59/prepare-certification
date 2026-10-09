# prepare-certification

Quiz d'entraînement aux certifications agiles : PSM II, PSPO I, PSK I, PSM-AI et CCA Agile.

**Site : https://vinchou59.github.io/prepare-certification/**

Le quiz fonctionne entièrement dans le navigateur, sur ordinateur comme sur téléphone, sans installation ni compte. Le bouton « Partager » de l'accueil affiche le lien et un QR code.

## Fonctionnement

- **Entraînement** : correction et explications après chaque question.
- **Examen** : chronomètre, navigation libre entre les questions, correction complète à la fin.
- Raccourcis clavier : les lettres (A, B, C…) pour répondre, Entrée pour valider, flèches gauche et droite pour naviguer.
- En mode Examen, **Marquer pour revoir** signale une question sur la barre de progression ; l'avertissement de fin rappelle les questions marquées.
- L'ordre des réponses est **mélangé** à chaque quiz (réglage « Ordre des réponses » à l'accueil). Les réponses « All of the above » restent en dernier, les questions Vrai/Faux gardent leur ordre.
- **Signaler un problème**, sous chaque correction, ouvre une issue GitHub pré-remplie (compte GitHub nécessaire).
- `?seed=42` à la fin de l'adresse rend le tirage des questions et le mélange des réponses reproductibles.

## Suivre sa progression

- Chaque quiz terminé est enregistré **dans le navigateur de l'appareil utilisé**, sans compte ni envoi de données.
- L'accueil affiche les 10 derniers résultats de la certification choisie, par rapport au seuil de réussite.
- Une question ratée devient « à retravailler » jusqu'à ce qu'elle soit réussie. Le bouton **Retravailler mes erreurs** de l'accueil lance un quiz avec ces questions ; **Retravailler ces erreurs** fait de même avec les erreurs du quiz qui vient de se terminer.
- **Effacer mon historique**, en bas de l'accueil, remet tout à zéro.

Les réponses ne sont affichées qu'à la correction, mais elles font partie des données du site : c'est un outil d'entraînement, pas d'examen.

## Organisation du dépôt

| Dossier | Contenu |
| --- | --- |
| `site/` | Le site publié : `index.html`, `app.css`, `js/` (interface et logique du quiz) |
| `site/data/` | `certifications.json` et une banque `questions_*.json` par certification |
| `tests/` | Tests de la logique du quiz et de la cohérence des banques (Node.js) |
| `openspec/` | Specs du projet et historique des changements (OpenSpec) |

## Travailler en local

```bash
npm test     # lance les tests (Node.js 20 ou plus, aucune dépendance à installer)
npm start    # sert le site sur http://localhost:8765/ (Python 3)
```

## Publication

À chaque push sur `main`, GitHub Actions lance les tests puis publie le dossier `site/` sur GitHub Pages. Si un test échoue, par exemple une question incohérente, rien n'est publié et l'ancienne version reste en ligne.

## Ajouter une certification

1. Ajouter `site/data/questions_<certif>.json` (même format que les fichiers existants).
2. Déclarer la certification dans `site/data/certifications.json` (identifiant, noms, fichier, seuil de réussite ou `null`).
3. Lancer `npm test` : le test de cohérence signale toute question incomplète.

Un texte ou une explication ne doit jamais désigner une autre réponse par sa lettre (« option B ») : l'ordre des réponses est mélangé. Le test de cohérence le vérifie.
