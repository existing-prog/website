# Étude de rendu Atelier Pizza

Le script `pizza_review.py` construit une scène Blender indépendante, avec la pizza en volumes, la main articulée, la planche, les matières et un éclairage de studio. Il produit une image PNG de 1200 × 800 et le fichier `.blend` de la pose. La scène constitue une étude à valider, sans animation continue ni intégration au scroll.

Depuis la racine du dépôt, avec Blender 4.3 :

```sh
blender -b -t 3 --python tools/blender/pizza_review.py -- --stage 2 --output /tmp/pizza-review
```

Les étapes sont `1` (pizza entière, vue du dessus), `2` (main et part soulevée) et `3` (part absente, miettes). `--samples` règle la qualité du rendu Cycles ; la valeur par défaut est 96. `--threads` règle le nombre de threads du moteur. Le débruitage reste désactivé pour fonctionner aussi dans les installations sans OpenImageDenoise.

La main utilise le GLB local CC0, documenté dans [sa notice de provenance](../../public/assets/models/ANATOMICAL-HAND-LICENSE.txt). La paume est tournée vers le haut ; les quatre doigts sont ajustés sous la pâte. Le rendu utilise une matière unie, sans atlas photographique de peau.

Les rendus présentés pour validation sont copiés dans `public/assets/pizza-blender-review/` ; la page `/lab/pizza-blender/` sert uniquement à comparer les trois images. Les anciens prototypes et la page commerciale Atelier Pizza restent indépendants.

Les PNG de cette première étude sont des images de validation : les réglages de contact, la direction artistique et la caméra peuvent encore évoluer. Une fois la direction choisie, il restera à travailler les poses intermédiaires, le rythme et l’export vidéo ou séquence d’images pour le scroll.

## Débruitage des images de revue

Les images de la page de comparaison sont calculées avec Cycles (64 échantillons pour les vues du dessus, 48 pour la prise), puis débruitées avec Open Image Denoise 2.5.1. Le rendu brut et la scène `.blend` sont conservés dans le dossier de sortie. Ce traitement filtre le bruit du rendu sans générer de nouvelle forme.

L’exécutable officiel est disponible dans les [publications Open Image Denoise](https://github.com/RenderKit/oidn/releases). Il n’est pas embarqué dans le site. Installer les dépendances du script dans un environnement Python dédié à partir de `tools/blender/requirements.txt`, puis lancer :

```sh
python tools/blender/denoise_review.py --oidn /chemin/oidnDenoise --input /tmp/pizza-review/pose-02.png --output /tmp/pizza-review/pose-02-clean.png
```

Pour régénérer directement des images plus échantillonnées, le générateur Blender accepte `--samples 256`. Les trois images validées seront suivies d’une étape de travail du mouvement ; l’interpolation des poses n’est pas encore construite.

## Prévisualisation du mouvement — six secondes

`pizza_motion.py` réutilise la scène de revue, affine le raccord du poignet et crée une animation Blender native de 144 images à 24 images par seconde. Les quatre doigts restent sous la part ; le pouce se ferme sur la croûte. Une légère souplesse de la pointe accompagne la levée. La sortie est unique et ses bornes projetées sont vérifiées avant de masquer la part hors champ.

```sh
blender -b -t 3 --python tools/blender/pizza_motion.py -- --output /tmp/pizza-motion --width 768 --samples 8
blender -b /tmp/pizza-motion/pizza-motion.blend -t 3 -a
python tools/blender/encode_motion.py --output /tmp/pizza-motion --oidn /chemin/oidnDenoise
```

Le générateur enregistre `pizza-motion.blend` et `motion.json`. Les poses et la caméra sont des clés éditables dans Blender ; la lecture du fichier n’exige pas un script externe. Les repères de la timeline indiquent l’approche, la prise, la sortie et le retour de la caméra.

Le rendu peut être partagé en plages d’images indépendantes (`-s 1 -e 48 -a`, puis `49–96` et `97–144`) dans des processus distincts, en adaptant le nombre de threads aux ressources disponibles. Les PNG sont nommés `raw/frame-0001.png` à `raw/frame-0144.png`.

L’assembleur conserve les PNG bruts, débruite les images puis produit `preview-v01.mp4` et `poster-v01.jpg`. Il reprend les images déjà débruitées après interruption. Le MP4 utilise H.264, des pixels YUV420 et un index placé en début de fichier pour les navigateurs mobiles. Il est muet. Toutes les images proviennent du rendu Blender ; aucune image intermédiaire n’est inventée par interpolation vidéo.

Cet export de 768 × 512 et huit échantillons Cycles par image sert à valider la chorégraphie. La durée et la cadence sont vérifiées sur le MP4. L’export léger utilisé dans l’étude de cas et son branchement au scroll sont décrits ci-dessous ; une future hausse de résolution pourra remplacer le média sans changer la composition.

## Film livré au scroll dans l’étude Atelier Pizza

Le fichier de travail des 144 images débruitées sert aussi à produire l’export web :

```sh
ffmpeg -framerate 24 -i /tmp/pizza-motion/clean/frame-%04d.png -frames:v 144 -c:v libx264 -crf 18 -g 6 -keyint_min 6 -bf 0 -sc_threshold 0 -pix_fmt yuv420p -an -movflags +faststart pizza-scroll-v1.mp4
```

Les images clés sont espacées d’un quart de seconde, sans images B, pour limiter le poids et faciliter les recherches de temps dans les décodeurs mobiles. Les images WebP `first-v1.webp` et `final-v1.webp` proviennent des images 1 et 144. Le film ne démarre jamais en lecture automatique : `useAtelierPizzaFilm.ts` fait suivre son temps au scroll et regroupe les recherches pendant les gestes rapides.

Le composant est limité à l’étude Atelier Pizza. Le film ne charge qu’à proximité de la scène ; les préférences de mouvement réduit et les petits écrans en paysage montrent l’image finale sans charger le MP4. Une erreur réseau ou de décodage revient à cette même présentation statique, sans longue piste de scroll. La traduction garde le même élément vidéo et ne recharge pas le média.

### Composition de la scène Atelier Pizza

La piste `.atelier-scene-track` maintient **la scène entière** en sticky CSS à
80 px du haut, sur ordinateur et téléphone. Le titre, la légende et la pizza
restent visibles ensemble. Sa course est limitée à 75 svh ; le ScrollTrigger
mesure `track.offsetHeight - stage.offsetHeight` au redimensionnement.
Les trois repères décoratifs changent selon la progression, sans masquer les
informations utiles. Les détails du menu suivent dans le flux normal et restent
accessibles si le film échoue. Le masque commun aux posters et à la vidéo fond
les bords du rendu dans le fond, sans recadrer le fichier source.
