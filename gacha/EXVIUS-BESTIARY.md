# Bestiaire FFBE — import idle uniquement

625 entrées de sprites distinctes sont préparées à partir des fichiers `_idle.png` fournis. Les deux répétitions strictes et la seconde disposition du même idle Red Marshmallow sont dédupliquées. Les `_atk.png` ne sont ni utilisés ni publiés. Le résultat contient 3 146 frames dans 93 pages WebP lossless de 1 024 × 1 024, environ 16,86 Mo au total. Deux sources ne contiennent qu’une seule frame : elles restent statiques, sans inventer d’animation.

Les frames utilisent une grille source puis une même boîte de découpe pour toute la séquence, sans recentrage individuel. Trois grilles à effets débordants ont un découpage explicite : Amoebozoa (3 × 2), Veritas of the Earth 3051610 (8 × 1), 3051910 (8 × 1). Les 3 146 frames ont été comparées aux sources : pixels visibles, alpha et limites des rectangles. Les ennemis sont dessinés frame par frame dans un canvas de taille fixe. Seule l’orientation de combat est retournée vers les joueurs ; les originaux ne sont pas modifiés.

## Noms et types

Le [bestiaire fourni](https://exvius.fandom.com/wiki/Category:Monsters) est la référence des créatures. Les noms sont associés aux IDs à l’aide des [données FFBE GL](https://github.com/aEnigmatic/ffbe/blob/master/monster_skillsets.json) et de [monster_ai.json](https://github.com/aEnigmatic/ffbe/blob/master/monster_ai.json). Les IDs de rencontre de ces tables portent deux chiffres de variante après l’ID graphique à 7 chiffres. Le nom de l’entrée `00`, quand disponible, est préféré ; sinon le nom associé le plus fréquent est conservé. `sourceIds` permet de revoir cette correspondance.

490 entrées ont un nom issu de ces données. Les 135 autres sont accessibles dans le filtre « À identifier » du bestiaire sous leur ID source, mais ne sont pas tirées dans les vagues : aucun nom n’est inventé. Les types Pokémon sont attribués d’après la créature et son élément, avec Normal par défaut, selon la validation de l’utilisateur. Les PV/ATK/SPE sont équilibrés pour ce roguelike et ne prétendent pas reproduire les statistiques FFBE.

## Rencontres

Les rencontres sont déterministes pour un ID de run et un étage, mais varient entre les runs. Les pools se débloquent progressivement sur les 10 paliers. Un boss est présent tous les 5 étages ; les boss des étages 10+ ont davantage d’accompagnateurs. Les six anciens ennemis TWEWY restent dans la rotation (environ 1 emplacement sur 13), et les ennemis des runs sauvegardées ne sont pas remplacés.

Profils : Chasseur (cible le plus faible ratio de PV, indiqué dans l’ordre du tour), Cuirassé (−15 % de dégâts reçus, sans annuler les immunités), Absorption (soin de 15 % des dégâts effectivement infligés), Rage des boss (+35 % d’ATK sous 40 % de PV). Le double toucher sur un ennemi affiche son profil. Le menu Bestiaire présente les idles, les types et les caractéristiques de base.

Les atlas sont chargés à la demande, avec un cache de six promesses d’images ; les composants actifs conservent leurs seules pages nécessaires. Pas de préchargement des 17 Mo à l’ouverture. L’animation respecte la réduction des mouvements et ne redessine pas pendant que le document est masqué. Si l’index du bestiaire manque, le jeu le recharge avant d’ouvrir la progression : une erreur réseau ne doit pas effacer une reprise contenant un ID FFBE.

Validation : correspondance exacte des 3 146 frames, 3 000 compositions de vagues, variation/stabilité des seeds, profils, immunités, sauvegardes, rattrapage unique de Cetruc préservé, navigation du bestiaire, rendu des idles et tour de combat dans le navigateur.

