\# node2exe



🚀 Convertis facilement ton application Node.js en executable Windows (.exe) avec SEA (Single Executable Applications).



\## Installation



```bash

npm install --save-dev @klicat/node2exe

```



\## Utilisation



\### Option 1 : Commande directe

Dans ton projet, lance :

```bash

npx node2exe

```



\### Option 2 : Script npm

Ajoute à ton `package.json` :

```json

{

&nbsp; "scripts": {

&nbsp;   "build:exe": "node2exe"

&nbsp; }

}

```



Puis lance :

```bash

npm run build:exe

```



\## Prérequis



\- \*\*Node.js 24+\*\* (avec support SEA)

\- \*\*Windows\*\*

\- Un fichier `app.js` ou `index.js` dans ton projet

\- Un fichier `package.json`



\## Comment ça marche



1\. ✅ Détecte automatiquement `app.js` ou `index.js`

2\. ✅ Installe `postject` s'il n'est pas déjà présent

3\. ✅ Crée `sea-config.json` automatiquement

4\. ✅ Génère le blob SEA

5\. ✅ Crée l'executable `app.exe`

6\. ✅ Nettoie les fichiers temporaires



\## Résultat



Un fichier `app.exe` qui fonctionne \*\*sans avoir besoin de Node.js installé\*\* sur la machine !



\## Exemple



```bash

\# Installation

npm install --save-dev @klicat/node2exe



\# Utilisation

npx node2exe



\# Résultat

\# ✅ app.exe créé!

```



\## Fichiers générés



\- `app.exe` - Ton executable final (à distribuer)

\- `sea-config.json` - Configuration SEA (optionnel après création)

\- `node\_modules/` - Contient postject et dépendances



\## Notes



\- L'executable créé inclut tout ton code et Node.js

\- Aucune dépendance externe requise pour l'exécuter

\- Fonctionne sur Windows

\- Taille typique : 60-80 MB selon ton app

\- Le script est écrit en JavaScript pur (cross-platform)



\## Licence



MIT



\## Support



Problèmes ? Crée une issue sur : https://github.com/klicat/node2exe/issues

