# Historique des vœux

Le bouton « Historique des vœux » est disponible dans Team et Gacha. Chaque lot confirmé de 1 ou 10 vœux conserve date (heure de Paris), portail, résultats exacts, doublons et rang au moment du tirage, coût en pièces, gratuits utilisés, soldes avant/après et numéros d’invocation.

Les invocations antérieures sont indiquées comme un total historique sans détails : leurs résultats n’étaient pas enregistrés. Ce total peut être une estimation pour les sauvegardes très anciennes qui ne contenaient pas encore wishesMade. Aucun personnage ou badge existant n’est supprimé.

## Persistance

Les reçus sont d’abord enregistrés avec la progression dans gameSaves. Après confirmation de cette sauvegarde seulement, le client les archive sous wishHistory/<discordId>/<eventId>. Les événements sont privés et immuables. Le même identifiant est réutilisé lors des nouvelles tentatives. Les pages affichent 20 lots, avec chargement des précédents. Un événement n’est retiré de la file locale qu’après confirmation de son archivage.

Publier **database.rules.json dans Firebase Realtime Database → Règles** pour activer wishHistory. Le push GitHub ne publie pas les règles Firebase. Sans ces règles, les résultats restent dans la sauvegarde ; les invocations sont temporairement bloquées si la file atteint 50 lots ou 28 000 caractères, afin de ne pas perdre de reçus ni dépasser la taille autorisée de sauvegarde. L’accès Firebase réel doit être vérifié après publication ; les tests utilisent un serveur simulé.

## Correctif des gratuits

freeWishSpent et freeWishDaySpent remplacent l’attribution répétée de cadeaux par un décompte. Une sauvegarde ancienne active qui repropose le stock intégral (cas Sauce : 16) est migrée sans recrédit ; les nouveaux comptes conservent leur cadeau et les stocks partiellement consommés sont conservés. Les reçus locaux par compte ne sont avancés qu’après une sauvegarde distante confirmée. Ils empêchent un ancien enregistrement de réduire le compteur consommé sur cet appareil. À partir du 25 novembre, 3 gratuits par jour sans cumul ; l’inventaire des récompenses ne change pas.

Validation : navigateur headless à 360 px, annulation sans reçu, lot de 10 avec détail exact et garantie, compteurs jour suivant/coupure du cumul, reprise après refus d’archive, archivage idempotent, pagination sans doublon, conflit de sauvegarde sans archivage et protection du compteur confirmé.
