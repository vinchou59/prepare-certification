## Context

`app.js` chargeait `qrcode-generator` à la demande depuis jsDelivr ou cdnjs. Le site est statique et publié tel quel par GitHub Pages, sans étape de construction.

## Decisions

- **Copie de la version publiée** : fichier `js/qrcode.js` du tag `js1.4.4` du dépôt kazuhikoarase/qrcode-generator, renommé avec son numéro de version pour rendre une mise à jour explicite. La licence MIT l'accompagne.
- **Chargement paresseux conservé** : le script n'est chargé qu'au premier partage, la page d'accueil reste légère.
- **Repli conservé** : si le chargement échoue malgré tout, le lien et le bouton « Copier le lien » restent affichés.
