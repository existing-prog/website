# Variante C — pizza cartoon et prise par-dessous

Adresse : `/website/lab/pizza-cartoon/`.

Cette variante reprend le profil de croûte, les couches de fromage, la garniture et la palette du fichier `One slice. One gesture.html` fourni par Lucas. Le fichier n’est pas exécuté comme un document distant : la géométrie est adaptée dans `pizza.ts`, avec la version locale de Three.js. La présentation verte accompagne cette direction cartoon.

La main est reconstruite dans `hand.ts` avec une paume ovale, quatre doigts sous la pâte et un pouce qui contourne le bord pour se poser sur la croûte. Aucun gant ni texture de peau. Les poses ouvertes et fermées des quatre doigts sont préparées au chargement ; le scroll interpole leurs positions et leurs normales. Le pouce possède deux phalanges droites, une articulation arrondie et une base charnue intégrée à la paume : il ne suit plus une longue courbe tubulaire. Des bouts arrondis ferment les doigts. La levée initiale réserve une place aux doigts au-dessus de la planche.

La chorégraphie conserve la sortie unique hors du cadre, le retour au-dessus de la pizza et les miettes. Les commandes, la lecture facultative de neuf secondes, le mouvement réduit et le repli sans WebGL suivent les mêmes principes que la variante B. Aucun moteur de physique ni boucle 3D permanente n’est ajouté.

Les ingrédients sont fusionnés par matière, les positions sont déterministes et les ressources GPU sont libérées à la fermeture. Les modèles, la scène, les matériaux, les styles et les commandes sont répartis dans des fichiers distincts, commentés en français et formatés avec Prettier.

Les variantes A (`pizza-3d`) et B (`pizza-gesture`) restent disponibles. Aucun de leurs fichiers sources, ni la page commerciale Atelier Pizza, n’est modifié par cet essai.

Les matières utilisent trois paliers de lumière, sans tone mapping photographique. Les contours des ingrédients sont calculés en unités de scène pour conserver la même finesse sur les formes aplaties. Les surfaces de la main et de la pizza ne reçoivent pas les ombres projetées ; seule la planche les reçoit, pour garder un dessin propre sans bruit de shadow map sur la garniture.
