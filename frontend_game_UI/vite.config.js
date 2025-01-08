import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        // target: "https://anagram-game-cheating-detection.onrender.com",
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
