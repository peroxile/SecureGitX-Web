import { defineConfig } from "vite";

export default defineConfig({
  appType: "spa", // history API fallback in dev server
  build: {
    target: "es2022",
  },
});
