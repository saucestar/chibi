# Difficulté et reprise de run

Les ennemis ont davantage de PV et d’attaque dès le départ, une progression linéaire et quadratique plus marquée entre les paliers et des boss renforcés aux étages multiples de 5/10. Les vagues normales passent à 3 ennemis à l’étage 3, puis 4 à l’étage 11. Aucun nouvel ennemi ni changement de sprite n’est ajouté ici.

Les choix de bonus entre vagues sont supprimés. Les PV, les statistiques et les ressources restantes sont conservés d’un étage au suivant. La Team reçoit uniquement un soin complet, incluant les KO, lorsqu’elle entre dans un nouveau palier : 11, 21, 31, 41, 51, 61, 71, 81 et 91. La progression normale d’XP et les soins des psychs restent actifs ; la régénération normale de 2 EN en fin de tour est conservée.

## Sauvegarde

`Profile.run` contient l’identifiant, un numéro de checkpoint croissant, le statut, l’étage, le tour, le duo et ses statistiques/PV de run, les ennemis, les psychs équipés, les ressources, les gains déjà comptés et les actions restantes du tour. La création de run, chaque action et chaque transition d’étage enregistrent un checkpoint. Les XP, badges et 5 pièces de victoire sont crédités dans la même mise à jour que le checkpoint correspondant. Les checkpoints répétés ou obsolètes ne recréditent rien.

La page Team propose « Reprendre l’étage … ». « Mon duo » met la run en pause sans l’effacer. Une nouvelle run nécessite d’abandonner explicitement la précédente si elle est encore active. La défaite, l’abandon ou la fin de l’étage 100 sont terminaux pour cet identifiant. Les récompenses de collection déjà obtenues sont conservées.

Le stockage distant utilise le `gameSaves` existant, sans nouvelle règle Firebase. Un reçu local par compte garde les identifiants terminés et empêche une ancienne sauvegarde distante de les réactiver sur cet appareil. La synchronisation entre appareils exige la connexion et un enregistrement distant réussi ; une défaite hors connexion ne peut être connue immédiatement d’un autre appareil.

## Anciennes sauvegardes

Les sauvegardes antérieures ne contiennent pas l’état d’une run active : seulement le record d’étage. Ce record et les inventaires sont conservés, mais aucun point de reprise n’en est fabriqué, car la run pourrait déjà être perdue. Un checkpoint existant dont toute la Team est KO est automatiquement considéré comme perdu. Les statuts terminaux restent non récupérables après rechargement.

Validation : fermeture/rechargement au milieu d’un tour, reprise des actions restantes sans doublon, victoire rechargée sans double gain, pause/reprise, abandon, défaite puis nouvelle run à l’étage 1, soins uniquement aux changements de palier, validation des snapshots, croissance de difficulté et protection contre une ancienne sauvegarde distante. Les tests distants utilisent un serveur simulé.
