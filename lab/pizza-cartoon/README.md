# Variante C — pizza cartoon et prise par-dessous

Adresse : `/website/lab/pizza-cartoon/`.

Cette variante reprend le profil de croûte, les couches de fromage, la garniture et la palette du fichier `One slice. One gesture.html` fourni par Lucas. Le fichier n’est pas exécuté comme un document distant : la géométrie est adaptée dans `pizza.ts`, avec la version locale de Three.js. La présentation verte accompagne cette direction cartoon.

La main est reconstruite dans `hand.ts` avec une paume ovale, quatre doigts sous la pâte et un pouce qui contourne le bord pour se poser sur la croûte. Aucun gant ni texture de peau. Les volumes ouverts et fermés sont préparés au chargement ; le scroll interpole leurs positions et leurs normales. Des bouts arrondis ferment les doigts. La levée initiale réserve une place aux doigts au-dessus de la planche.

La chorégraphie conserve la sortie unique hors du cadre, le retour au-dessus de la pizza et les miettes. Les commandes, la lecture facultative de neuf secondes, le mouvement réduit et le repli sans WebGL suivent les mêmes principes que la variante B. Aucun moteur de physique ni boucle 3D permanente n’est ajouté.

Les ingrédients sont fusionnés par matière, les positions sont déterministes et les ressources GPU sont libérées à la fermeture. Les modèles, la scène, les matériaux, les styles et les commandes sont répartis dans des fichiers distincts, commentés en français et formatés avec Prettier.

Les variantes A (`pizza-3d`) et B (`pizza-gesture`) restent disponibles. Aucun de leurs fichiers sources, ni la page commerciale Atelier Pizza, n’est modifié par cet essai.
