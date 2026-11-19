# Activer la synchronisation du jeu

La progression locale historique du téléphone est prioritaire. Le navigateur ne peut pas initialiser une sauvegarde commune à partir de son ancien cache.

1. Dans la console Firebase du projet **chibi-be98b**, ouvrir **Realtime Database → Règles**. Publier le contenu complet de `database.rules.json` mis à jour dans ce dépôt. Le nouveau chemin `gameSaves/$uid` est privé et réservé au compte Discord correspondant.
2. Actualiser l’application sur le téléphone et ouvrir le jeu ou le gacha, connecté au compte Discord utilisé habituellement. Sa progression locale initialise la sauvegarde commune.
3. Ouvrir l’application dans le navigateur avec le même compte. La progression du téléphone remplace le cache de jeu du navigateur.

Le code publié sur GitHub ne publie pas automatiquement les règles Firebase. En cas de refus d’accès ou de panne réseau, le jeu affiche un état explicite et conserve les données locales.

Les données initiales de chaque appareil restent en copie locale sous `chibi.reapers-run.party.v1.before-cloud.mobile` ou `.browser`. Les sauvegardes en attente sont conservées localement. Si un autre appareil a modifié la progression entre-temps, une écriture trop ancienne est refusée et la progression commune est rechargée plutôt que remplacée.

La synchronisation porte sur pièces, personnages, badges, équipements, XP, rangs, doublons et éveils. La vague et les PV du combat en cours restent propres à la partie ouverte. Lors d’une actualisation distante, revenir à Team évite de continuer un combat calculé sur une ancienne progression.
