# Espace de jeu unifié

L’application utilise désormais une seule iframe pour le roguelike et le gacha. Le lien historique #gacha ouvre les invocations dans cette même iframe ; #game ouvre l’accueil. Le format gacha/index.html?vue=gacha reste compatible. Les demandes de navigation sont acceptées uniquement depuis la fenêtre parente et la même origine. La navigation n’interrompt pas une invocation en cours ni un combat.

Navigation commune : Accueil, Team, Invocations, Collection et Menu. L’accueil affiche le duo, le record d’étage, les pièces, les gratuits et des raccourcis vers les quêtes. Menu mène aux quêtes, à l’historique, à la collection et à l’équipement. Les pages utilisent les composants existants de sauvegarde, de quêtes et d’historique. Aucun nouvel inventaire ou solde n’est créé ; les tirages, garanties et récompenses conservent leurs règles.

La collection montre les personnages obtenus et non obtenus, avec un filtre Débloqués, une fiche, les stats de progression pour les personnages possédés et le catalogue des badges. Les taux de chaque portail donnent accès à une fiche avec sprite animé, types, psych de départ et stats de référence au niveau 1 / rang E. Le taux indiqué concerne le prochain vœu, y compris la garantie.

Direction artistique conservée : nacre, argent, violet, relief, glow, Montserrat Black. Les sprites originaux et leurs ratios sont conservés. Les captures Dokkan fournies servent à la hiérarchie de navigation et à la collection, sans reprendre leur palette verte.

Validation : navigation et toutes les fiches de portail, portraits redimensionnés 360/640/900 px, portrait et paysage, invocation de 10 suivie de l’historique exact, menus de quêtes, tour de combat complet, alias #gacha vers le même document sans rechargement. La publication des règles Firebase pour l’archive des vœux reste une opération distincte déjà documentée.
