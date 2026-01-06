import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";

import { read } from "./node_utils.js";
import { generateNav, locales } from "./navBar.js";
import { getFontCSS } from "./css.js";

const config = read("./pages/config.json");

export default defineConfig(async () => {
  return {
    head: [
      // Preconnect to Google Fonts CDN
      ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" }],
      // Link to the Google Font stylesheet
      ["style", {}, await getFontCSS(config.theme)],
      ["link", { rel: "manifest", href: "/manifest.json" }],
      ["link", { rel: "icon", href: "/favicon.ico", type: "image/x-icon" }],
      ["script", { "data-goatcounter": config.dev?.goatcounter || "", async: true, crossorigin: "anonymous", src: "//gc.zgo.at/count.js" }],
    ],
    locales: locales(config.languages),
    title: config.title,
    cleanUrls: true,
    description: config.description,
    themeConfig: {
      nav: await generateNav(config),
      config: config,
    },
    plugins: [tailwindcss()],
  };
});
