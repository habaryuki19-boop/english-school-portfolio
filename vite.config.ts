import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/english-study-tool/",
  plugins: [react()],
});
