/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` is "./" so the built site works from any path (e.g. GitHub Pages project page).
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
  },
});
