import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server:{
    port:5173,
    proxy: {
      '/security-master': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/security-master/, ''),
      },

      
    }
  }
});
