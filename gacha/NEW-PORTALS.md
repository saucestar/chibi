# Nouveaux portails et aperçus redimensionnables

- Apocalyptic Future : 2B (Acier/Combat), A2 (Acier/Ténèbres).
- Destiny Islands : Sora (Normal/Fée), Riku (Ténèbres/Psy).

Chaque portail ne contient que ses 2 personnages et les badges habituels. Les taux ordinaires sont fixes : 5 % par personnage, 90 % de badges. La garantie du 10e vœu utilise le même duo. Les pools des anciens portails sont conservés.

Les 4 animations idle proviennent des planches fournies, 4 frames chacune. Les frames sont assemblées sur une grille fixe avec un ancrage constant et un redimensionnement proportionnel, sans suppression des armes, pods ou effets. Les attaques restent celles du système de psychs ; aucune pose d’attaque non fournie n’a été créée.

Psychs initiaux : Virtuous Contract (2B, physique/Acier), Type-40 Blade (A2, physique/Acier), Kingdom Key (Sora, physique/Fée), Way to the Dawn (Riku, spécial/Ténèbres). Chaque nouveau personnage débute au rang E et suit la progression par doublons existante.

La présentation temporaire des deux portails reprend le duo de sprites idle de Partenaires, avec fond et lumière animés. Les aperçus du sélecteur et des cases Team utilisent `SpritePreview` et `ResizeObserver` pour adapter le sprite entier à la carte lorsque la fenêtre change de taille. Les armes de Cloud et des nouveaux personnages restent dans leurs cartes, avec le ratio original.
