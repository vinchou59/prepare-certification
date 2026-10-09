## Why

Le QR code du bouton « Partager » dépend d'une bibliothèque chargée depuis un CDN (jsDelivr, puis cdnjs en secours). Si ces services sont bloqués (réseau d'entreprise) ou indisponibles, le QR code ne s'affiche pas, et le site fait une requête vers un tiers.

## What Changes

- Inclure la bibliothèque `qrcode-generator` 1.4.4 (licence MIT) dans le site, sous `site/vendor/`, avec sa licence.
- La charger depuis le site lui-même, toujours seulement au premier clic sur « Partager ».
- Le site ne fait plus aucune requête vers un service tiers pour le QR code.

## Capabilities

### Modified Capabilities

- `site-publication` : le QR code est généré sans dépendre d'un service tiers.

## Impact

- Code : `site/js/app.js` (source de la bibliothèque), nouveaux fichiers `site/vendor/qrcode-generator-1.4.4.js` et `site/vendor/qrcode-generator-LICENSE.txt` (environ 50 Ko).
