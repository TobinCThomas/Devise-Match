import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative assets support project Pages, user Pages and custom domains.
  base: "./",
  plugins: [react()],
  build: { target: "es2022" },
});
