import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
// Konfigurasi ini disesuaikan supaya cocok jalan sebagai frontend Tauri:
// - port fix di 1420 (harus sama persis dengan "devUrl" di src-tauri/tauri.conf.json)
// - alias "@" -> "src" (dipakai shadcn/ui dan seluruh import project)
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },

  // Tauri butuh port yang fix, deterministik, tidak diacak seperti default Vite.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: "0.0.0.0",
    watch: {
      // jangan watch folder src-tauri, biar gak triple-rebuild saat cargo compile
      ignored: ["**/src-tauri/**"],
    },
  },
}));
