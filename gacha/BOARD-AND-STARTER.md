# Classements mobile et PC

L’onglet Classement ouvre un choix Mobile / PC. La page PC conserve les missions et niveaux existants. La page mobile affiche les joueurs par étage maximal décroissant, avec le palier correspondant (`ceil(étage / 10)`). Deux joueurs au même étage partagent le même rang. Les joueurs ayant seulement invoqué sont présents à l’étage 0.

La participation mobile est enregistrée au lancement du roguelike (`hasPlayed`) ou après une invocation (`wishesMade`). Une connexion, le cadeau de Neku et le crédit quotidien ne suffisent pas. Les anciennes sauvegardes comportant des indices de participation sont prises en compte lors de leur prochaine synchronisation.

La synchronisation publie uniquement nom, participation et meilleur étage dans `mobileLeaderboard/<Discord ID>`. L’inventaire complet reste privé dans `gameSaves`. L’étage public ne peut pas diminuer. Le classement utilise une écoute en direct, détachée lorsque l’on quitte la page.

## Activation Firebase

Publier le fichier complet `database.rules.json` mis à jour dans **Firebase → Realtime Database → Règles**. La nouvelle branche `mobileLeaderboard` est lisible par les membres connectés et modifiable uniquement par le propriétaire de son ID Discord. Le push GitHub ne publie pas ces règles.

Les anciens participants apparaîtront après avoir rouvert leur jeu/gacha connecté, afin de publier le résumé de leur sauvegarde. Aucun accès administrateur aux inventaires d’autres joueurs n’a été utilisé pour alimenter le classement.

## Démarrage

Neku et Pyrokinesis sont offerts sans consommer de vœu. Si Neku est déjà possédé, ses doublons, son rang et son XP sont conservés. Aucun inventaire existant n’est amputé ou remis à zéro.

L’ancienne exception d’invocations gratuites tant que le duo n’était pas constitué est supprimée : chaque invocation gratuite déduit désormais le compteur commun. Les pièces déjà présentes permettent toujours de payer une invocation après épuisement des crédits gratuits.

La conversion automatique des missions PC en pièces est décrite dans `PC-MISSION-COINS.md`. Elle ne compte pas comme une participation mobile.
