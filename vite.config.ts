import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    port: 3300,
    host: "0.0.0.0",
    // Phase 2A 이전: 직접 Gemini API 호출하므로 프록시 불필요
    // Phase 2A 이후: Vercel Serverless Functions 사용 시 프록시 재활성화
  },
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
