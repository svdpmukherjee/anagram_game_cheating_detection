import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../static",
  },
  server: {
    proxy: {
      "/api": {
        target: apiUrl,
        changeOrigin: true,
      },
    },
  },
});
