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
