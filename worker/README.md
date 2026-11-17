# CHIBI — mise en place de la connexion sécurisée

Le site ne fait plus confiance à la page : une petite fonction serveur (Cloudflare Worker, gratuit)
vérifie ton jeton Discord **et** que tu es membre du serveur, puis ouvre une session Firebase.
Les règles de la base n'acceptent que cette session.

Ordre à respecter (sinon le site arrête de marcher entre deux étapes) :
**1 → 2 → 3 → 4 (déployer le site) → 5 (règles) en dernier.**

## 1. Firebase : activer Authentication et créer une clé de service
1. Console Firebase → projet `chibi-be98b` → **Authentication** → *Commencer* (aucun fournisseur à activer).
2. ⚙ Paramètres du projet → **Comptes de service** → *Générer une nouvelle clé privée* → un fichier `.json` est téléchargé.
   Ne le mets jamais sur GitHub. Il contient `client_email` et `private_key`.

## 2. Cloudflare : créer le Worker (par le site, rien à installer)
1. Crée un compte gratuit sur dash.cloudflare.com → **Workers & Pages** → *Créer* → *Worker* → nom `chibi-auth` → *Déployer*.
2. *Modifier le code* → remplace tout par le contenu de `worker/src/index.js` → *Déployer*.
3. *Paramètres* → **Variables et secrets** :
   | Nom | Type | Valeur |
   |---|---|---|
   | `GUILD_ID` | Texte | ID de ton serveur Discord (clic droit sur le serveur → *Copier l'identifiant*, mode développeur activé) |
   | `ADMIN_IDS` | Texte | ton ID Discord (plusieurs : séparés par des virgules) |
   | `ALLOWED_ORIGINS` | Texte | `https://saucestar.github.io` |
   | `FIREBASE_CLIENT_EMAIL` | **Secret** | le champ `client_email` du fichier `.json` |
   | `FIREBASE_PRIVATE_KEY` | **Secret** | le champ `private_key` du fichier `.json` (tout, de `-----BEGIN` à `END PRIVATE KEY-----\n`) |
4. Note l'adresse du Worker : `https://chibi-auth.<ton-sous-domaine>.workers.dev`.

## 3. Mettre l'adresse du Worker dans le site et le launcher
Remplace `https://chibi-auth.REMPLACE.workers.dev` par la vraie adresse dans `auth.js`
(et dans le launcher : `Community.cs`, constante `WorkerUrl`).

## 4. Discord Developer Portal
OAuth2 → *Redirects* : les pages du site doivent y être (elles y sont déjà si la connexion marchait).
La connexion demande maintenant aussi `guilds.members.read` (Discord l'affiche à la prochaine connexion).

## 5. Règles de la base (en dernier)
Console Firebase → **Realtime Database** → **Règles** → colle le contenu de `database.rules.json` → *Publier*.
Tu peux d'abord les essayer dans le *Rules Playground* (onglet Règles).

## Après
- L'ancien mot de passe admin était dans le code public : s'il sert ailleurs, change-le.
- Pour annuler : remets tes anciennes règles dans la console (elles s'affichent dans l'historique des règles).
