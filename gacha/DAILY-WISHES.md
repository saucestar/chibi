# Vœux quotidiens et difficulté

- 3 vœux gratuits sont crédités par journée civile en Europe/Paris, à partir du 18 novembre 2026 (intégration mobile, commits `cb2f59f` / `654eca9`). Les journées manquées sont rattrapées et les crédits se cumulent sans expiration.
- Le compteur `freeWishes` et la dernière date créditée `lastFreeWishDay` font partie de la sauvegarde de compte. Recharger la page ne crédite pas une seconde fois le même jour. Un retour en arrière de l’horloge ne crée aucun crédit.
- Les crédits gratuits sont utilisés avant les pièces. Un lot de 10 avec 6 crédits coûte donc 400 pièces, et la confirmation détaille crédits utilisés/restants et pièces restantes. Les vœux de démarrage existants restent gratuits tant que le duo initial n’est pas constitué.
- Un vœu ordinaire a 10 % de chance de donner un personnage. La garantie au 10e vœu est conservée, y compris pour les vœux gratuits.
- Les poids des personnages sont fixes et indépendants des personnages obtenus, des doublons ou des éveils. First Week : Neku 5 %, Shiki 5 %. From another reality : Cloud 5 %, Aerith 5 %. Partenaires : Neku/Shiki 1,667 % chacun, Beat/Joshua 3,333 % chacun. Lors d’une garantie, ces proportions sont appliquées à un personnage garanti.

## Difficulté

`difficultyAt` définit 10 paliers de 10 étages, avec une augmentation graduelle à l’intérieur de chaque palier et une hausse au passage au suivant. Les PV, l’ATK, la SPE et l’XP ont des courbes séparées. Les boss d’étage 10/20/… sont plus forts que les boss intermédiaires d’étage 5/15/… .

Les groupes ordinaires passent de 2 ennemis aux étages 1–4 à 3 aux étages 5–19, puis 4 à partir du 20. Les boss ont 2 ennemis jusqu’au 39 et 3 ensuite. La croissance des dégâts est volontairement plus faible que celle des PV, pour limiter les morts immédiates en fin d’ascension. L’équilibrage reste à affiner à partir de parties réelles ; les tests automatisés vérifient surtout la progression, les bornes et les récompenses.
