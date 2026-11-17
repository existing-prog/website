# Essai interne : suite d’images au scroll

Page de test du moteur `src/scrollSequence.ts` avec une vidéo générée par IA.
Elle n’est **pas** incluse dans le build publié et ses images ne sont pas versionnées.

Pour la lancer en local :

1. Extraire les images d’une vidéo (une sur deux, en WebP) :

   ```sh
   mkdir -p public/assets/sequence-test/desktop public/assets/sequence-test/mobile
   ffmpeg -i video.mp4 -an -vf "select='not(mod(n\,2))',scale=1280:-2" -vsync vfr -c:v libwebp -quality 58 public/assets/sequence-test/desktop/%03d.webp
   ffmpeg -i video.mp4 -an -vf "select='not(mod(n\,2))',scale=720:-2" -vsync vfr -c:v libwebp -quality 55 public/assets/sequence-test/mobile/%03d.webp
   ```

2. Ajuster `FRAMES` dans `src/prototypes/scroll-sequence/main.ts` au nombre d’images.
3. `npm run dev`, puis ouvrir `/website/lab/scroll-sequence/`.
