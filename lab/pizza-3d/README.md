# Prototype indépendant : pizza en 3D

Adresse de développement : `/website/lab/pizza-3d/`.

Cette entrée Vite est une expérimentation à examiner avec Lucas avant toute intégration. Elle n’est ni liée depuis la navigation du site, ni utilisée à la place de l’animation Atelier Pizza en production. La page porte une directive `noindex, nofollow` ; son adresse est publique, ce n’est pas une page privée.

## Organisation

- `index.html` : structure, textes et commandes accessibles du prototype.
- `src/prototypes/pizza3d/main.ts` : commandes, ScrollTrigger, mouvement réduit, repli et nettoyage.
- `src/prototypes/pizza3d/scene.ts` : lumière, caméra, prise commune main/part et rendu à la demande.
- `src/prototypes/pizza3d/pizza.ts` : parts extrudées, croûte et contours successifs des bouchées.
- `src/prototypes/pizza3d/hand.ts` : main stylisée, articulations et interpolation de la prise.
- `src/prototypes/pizza3d/style.scss` : présentation indépendante ; aucun import dans le site React.
- `tests/pizza-lab.spec.ts` : scroll aller/retour, commandes, mobile, mouvement réduit, repli WebGL et isolation du site.

## Réglages du mouvement

La progression `0…1` est la source unique de la pose. Les intervalles de `scene.ts` règlent l’entrée de la main, la prise, le soulèvement et le changement de caméra. `biteTimes` donne les cinq moments où la géométrie de la part change. Les états sont préconstruits : aucun modèle n’est reconstruit au scroll, et revenir en arrière restitue la même pose.

La page utilise un sticky CSS et le défilement natif. Le curseur et les boutons pilotent la même progression. La lecture automatique n’a lieu que sur demande, s’arrête au toucher, au scroll, au clavier ou lorsque l’onglet est masqué. Le bouton Pause reste visible dans la scène.

En mouvement réduit, la longue piste est supprimée et la scène reste fixe. Les commandes permettent de choisir volontairement une pose. Sans WebGL ou après perte de contexte, une illustration et un lien vers le projet original restent disponibles.

## Modèles, coût et limites

Les géométries sont créées en code avec Three.js, sans modèle 3D distant ni fichier sous licence à acheter. La pizza réutilise l’illustration existante `public/assets/atelier-pizza-whole.webp`. La croûte utilise une texture de pain générée localement. Le dos de la pizza, la mie et la main sont stylisés ; il ne s’agit pas d’une simulation anatomique ou physique de la nourriture.

Three.js n’est chargé que dans l’entrée `pizzaLab`. Le moteur ne fait pas partie du module partagé avec le site commercial. Le rendu est demandé lors d’un changement de pose ou de taille, sans boucle permanente au repos. La densité de pixels est plafonnée, les ombres utilisent une seule carte de 1024 px, les ressources sont libérées à la sortie de la page.

Pour vérifier les modifications :

```sh
npm run build
CHROMIUM_PATH=/usr/bin/chromium npm test -- tests/pizza-lab.spec.ts
```

Le rendu doit encore être apprécié sur des appareils réels avant de décider d’une intégration. La direction de la main, le contact avec la croûte, la matière et le rythme sont les principaux points de discussion de cette première version.
