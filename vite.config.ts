import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Entrées du laboratoire 3D. Sur le site, Three.js est chargé à la demande
// (import dynamique de src/world/worldScene.ts) : jamais au premier affichage.
export default defineConfig({
  plugins: [react()],
  base: "/website/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        pizzaLab: "lab/pizza-3d/index.html",
        pizzaGesture: "lab/pizza-gesture/index.html",
        pizzaCartoon: "lab/pizza-cartoon/index.html",
        pizzaBlender: "lab/pizza-blender/index.html",
      },
    },
  },
});
