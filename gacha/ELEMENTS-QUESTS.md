# Quêtes, équipement et éléments

Le bouton **Quêtes** se trouve dans Team et dans le gacha. Les récompenses se récupèrent individuellement ou avec **Tout récupérer**. Les identifiants déjà récupérés sont sauvegardés dans la progression commune.

- Étages 10, 20, …, 100 : 100 pièces par palier. Le plus haut étage atteint est maintenant enregistré. L’ascension s’arrête après le combat de l’étage 100.
- Collection : 20 pièces pour chaque tranche de 10 badges uniques. Les doublons n’augmentent pas ce compteur.
- Personnages : 50 / 100 / 150 pièces pour 2 / 4 / 6 recrues ; 50 / 100 / 250 pièces quand un personnage atteint le niveau 5 / 10 / 25 ; 150 pièces pour un premier éveil.
- La collection, les niveaux et les recrues existants comptent rétroactivement. Les anciens étages n’étaient pas enregistrés : **Rattraper mon ancien étage 10** permet de restaurer le palier indiqué par le propriétaire de cette sauvegarde historique, puis de récupérer sa récompense. Ce rattrapage ne s’applique pas automatiquement aux autres comptes.

Chaque personnage peut porter 3 psychs. Dans le duo actif, un badge ne peut être équipé que par un seul partenaire. Les anciens équipements en conflit sont corrigés en gardant le badge sur le premier emplacement du duo ; le second reçoit un psych libre si disponible. Aucun badge n’est supprimé de la collection.

## Types validés

| Personnage | Types |
| --- | --- |
| Neku | Psy |
| Shiki | Normal |
| Beat | Combat |
| Joshua | Psy / Vol |
| Cloud | Combat / Acier |
| Aerith | Plante / Fée |

| Ennemi | Types |
| --- | --- |
| Big Bang Frog | Eau |
| Garage Wolf | Ténèbres |
| Shinigami | Ténèbres / Vol |
| Jey Pengi | Eau / Glace |
| Electro Pengi | Électrik |
| Psyche Fox | Psy |

Les badges reçoivent leur élément selon leur pouvoir : flammes → Feu, eau → Eau, foudre → Électrik, glace → Glace, séisme → Sol, roches → Roche, lianes → Plante, pouvoirs mentaux → Psy, épées/lances → Acier, soins et pouvoirs sacrés → Fée. Les pouvoirs sans élément identifiable restent Normal. Les attaques ennemies utilisent leur premier type. Sync Burst utilise Normal.

Le tableau complet des 18 types suit le [tableau officiel Pokémon](https://ph.portal-pokemon.com/game/type-chart/) : ×2, ×½, immunités ×0 ; les deux types défensifs se multiplient (jusqu’à ×4 et ×¼). Les soins ne sont pas multipliés par les affinités. L’aperçu de cible et les indications de dégâts affichent l’efficacité.

Toutes les règles sont définies dans `game.tsx` (`typeChart`, `characterElements`, `enemyElements`, `badgeElement`, `questsFor`). Les nouveaux boutons héritent des animations et du comportement tactile communs. Les champs de saisie restent sélectionnables, contrairement aux éléments du HUD.
