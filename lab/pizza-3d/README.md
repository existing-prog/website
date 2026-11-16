# Prototype indépendant : pizza en 3D

Adresse de développement : `/website/lab/pizza-3d/`.

Cette entrée Vite est une expérimentation à examiner avec Lucas avant toute intégration. Elle n’est ni liée depuis la navigation du site, ni utilisée à la place de l’animation Atelier Pizza en production. La page porte une directive `noindex, nofollow` ; son adresse est publique, ce n’est pas une page privée.

## Organisation

- `index.html` : structure, textes et commandes accessibles du prototype.
- `src/prototypes/pizza3d/main.ts` : commandes, ScrollTrigger, mouvement réduit, repli et nettoyage.
- `src/prototypes/pizza3d/scene.ts` : lumière, caméra, prise commune main/part et rendu à la demande.
- `src/prototypes/pizza3d/choreography.ts` : progression partagée des sorties hors champ, des bouchées et des retours.
- `src/prototypes/pizza3d/pizza.ts` : parts extrudées, croûte et contours successifs des bouchées.
- `src/prototypes/pizza3d/hand.ts` : main stylisée, articulations et interpolation de la prise.
- `src/prototypes/pizza3d/style.scss` : présentation indépendante ; aucun import dans le site React.
- `tests/pizza-lab.spec.ts` : scroll aller/retour, commandes, mobile, mouvement réduit, repli WebGL et isolation du site.

## Réglages du mouvement

La progression globale `0…1` est la source unique de la pose. Dans la version 3, le geste occupe les premiers 86 % de la scène : `storyProgress = Math.min(progress / 0.86, 1)`. Les intervalles de `scene.ts` règlent l’entrée de la main, la prise, le soulèvement et le changement de caméra. La caméra s’arrête avant les trois courts allers-retours de la main vers le haut à droite, hors du cadre.

Les fenêtres de `choreography.ts` centralisent le départ, la pause hors champ, le changement d’état de la part et son retour. Les valeurs du tableau utilisent `storyProgress`, pas la progression globale de la page :

| Trajet    | Départ | Hors champ | Changement de part | Début du retour | Retour au repos |
| --------- | ------ | ---------- | ------------------ | --------------- | --------------- |
| Premier   | 0,650  | 0,685      | 0,695 → état 2     | 0,710           | 0,745           |
| Deuxième  | 0,755  | 0,790      | 0,800 → état 4     | 0,815           | 0,850           |
| Troisième | 0,860  | 0,895      | 0,905 → état 5     | 0,920           | 0,950           |

Chaque pause laisse comprendre que la part est mangée hors champ ; sa silhouette ne change jamais à l’écran. Les deux premiers retours montrent une part plus petite. Au troisième, la main revient vide, reste brièvement visible jusqu’à `storyProgress = 0,960`, puis sort définitivement à `0,985`. Sa sortie se termine donc à la progression globale `0,8471`, avant le retour de caméra.

De `progress = 0,86` à `0,96`, la caméra revient au-dessus de l’assiette. La pizza garde sa part manquante. Quelques petites miettes fixes apparaissent sur l’assiette entre `0,86` et `0,94` : elles ne flottent pas dans l’air. Le texte arrive à côté de la pizza de `0,94` à `1`, dans une composition proche de la page Atelier Pizza actuelle. Le canvas reste visible pendant cette conclusion ; la scène ne disparaît plus derrière un écran de texte.

Les états de bouchées restent préconstruits : aucun modèle n’est reconstruit au scroll. Toute la séquence est déterministe : revenir en arrière restitue le même trajet et la même part.

La piste mesure 340 svh sur ordinateur et 300 svh sur téléphone, soit environ 30 % de défilement en moins que la version précédente. La page utilise un sticky CSS et le défilement natif. Le curseur et les boutons pilotent la même progression. La lecture automatique dure 13 secondes, n’a lieu que sur demande et s’arrête au toucher, au scroll, au clavier ou lorsque l’onglet est masqué. Le bouton Pause reste visible dans la scène.

En mouvement réduit, la longue piste est supprimée et la scène reste fixe. Les commandes permettent de choisir volontairement une pose. Sans WebGL ou après perte de contexte, une illustration et un lien vers le projet original restent disponibles.

## Modèles, coût et limites

Les géométries sont créées en code avec Three.js, sans modèle 3D distant ni fichier sous licence à acheter. La main utilise une enveloppe continue pour la paume et le poignet, ainsi que des doigts dont les buffers de sommets et de normales sont déformés en place. La prise est mise en cache : quand sa valeur reste identique, aucun sommet n’est recalculé. De fines textures générées localement donnent un grain mat à la main et un tissage discret à la manche.

La pizza réutilise l’illustration existante `public/assets/atelier-pizza-whole.webp`. Ses dessus subdivisés portent un relief léger guidé par les couleurs de la garniture. Les croûtes fermées ont un profil irrégulier et une dorure de cuisson ; leurs faces coupées et les tranches utilisent une matière de mie pâle et alvéolée. Les géométries de toutes les bouchées sont préconstruites avant le premier rendu, sans subdivision pendant le scroll. Le dos de la pizza, la mie et la main restent stylisés ; il ne s’agit pas d’une simulation anatomique ou physique de la nourriture.

Three.js n’est chargé que dans l’entrée `pizzaLab`. Le moteur ne fait pas partie du module partagé avec le site commercial. Le rendu est demandé lors d’un changement de pose ou de taille, sans boucle permanente au repos. La densité de pixels est plafonnée, les ombres utilisent une seule carte de 1024 px, les ressources sont libérées à la sortie de la page.

Pour vérifier les modifications :

```sh
npm run build
CHROMIUM_PATH=/usr/bin/chromium npm test -- tests/pizza-lab.spec.ts
```

La version 4 conserve cet enchaînement et affine les volumes de la main, le contact avec la croûte et les matières de la pizza. Les modèles restent procéduraux et stylisés ; ils doivent être jugés dans la scène et sur des appareils réels.

Le rendu doit encore être apprécié sur des appareils réels avant de décider d’une intégration. Le rythme des sorties hors champ, le retour à la vue du dessus et la place laissée au texte sont les principaux points de discussion de cette version.
