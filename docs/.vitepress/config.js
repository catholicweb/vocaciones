import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";
import { generate } from "./generateConfig.js";

export default defineConfig(async () => {
  let config = await generate();

  config.plugins = [tailwindcss()];

  return config;
});
