# Missions PC → pièces mobiles

Chaque mission PC rapporte `floor(score / 10)` pièces au jeu mobile. Exemple : 125 points donnent 12 pièces ; à 130 points, 1 pièce supplémentaire est créditée. Le score PC lui-même n’est ni supprimé ni modifié.

Le rattrapage concerne tous les jours encore présents dans Firebase, pas seulement les 7 jours affichés dans le classement PC. La synchronisation lit d’abord les clés des jours avec une requête `shallow`, puis écoute uniquement `missions/<jour>/<ID Discord du joueur connecté>`. Les scores des autres joueurs ne sont pas téléchargés par cette conversion.

Le crédit est automatique à l’ouverture du jeu ou du gacha connecté au même compte Discord. Les mises à jour de score sont ensuite suivies en direct sur les jours connus, avec surveillance du jour courant. Le détail est visible dans **Quêtes → Missions PC**.

La progression sauvegarde le montant déjà crédité par jour dans `pcMissionCoins`. Crédit et pièces sont enregistrés ensemble dans la sauvegarde révisée du compte : un rechargement ou un second appareil ne recrée pas une récompense déjà payée. Une baisse de score ou une suppression de mission ne retire pas de pièces ni d’objets. En cas d’indisponibilité réseau, les montants déjà reçus sont conservés et le rattrapage reprend à la prochaine synchronisation.

Les crédits de pièces et les quotas quotidiens ne font pas entrer un compte dans le classement mobile. Neku offert ne compte pas non plus comme une invocation. Seul un lancement du roguelike ou une invocation effective valide la participation.

Les règles existantes de lecture des missions et de sauvegarde privée sont utilisées. La nouvelle branche du classement mobile requiert séparément la publication de `database.rules.json` dans la console Firebase.
