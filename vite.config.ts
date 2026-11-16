import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Entrée indépendante : Three.js ne se charge que dans le laboratoire 3D.
// Le site commercial conserve son parcours et son animation de production.
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
      },
    },
  },
});
