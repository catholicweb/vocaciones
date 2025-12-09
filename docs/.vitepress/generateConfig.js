import MarkdownIt from "markdown-it";
import path from "path";
import fs from "fs";
import matter from "gray-matter";
import sharp from "sharp";
import { getPreview } from "./oembed.js";
import { generateNav } from "./navBar.js";

const md = new MarkdownIt({ html: true, linkify: true });

function readFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");

  if (filePath.endsWith(".json")) {
    return JSON.parse(content || "{}");
  }

  return matter(content).data || {};
}

async function createManifest(config) {
  let manifest = {
    name: config.title,
    short_name: config.title,
    description: config.description,
    start_url: "/",
    display: "standalone",
    background_color: config.theme.accentColor,
    theme_color: config.theme.accentColor,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
  const baseDir = path.resolve("");
  fs.writeFileSync(baseDir + "/docs/public/manifest.json", JSON.stringify(manifest), "utf8");

  if (!config.icon) return;

  // Generate icons
  let fullPath = path.resolve(baseDir, "docs/public" + config.icon);
  for (const size of [192, 512]) {
    try {
      await sharp(fullPath)
        .resize(size, size)
        .png()
        .toFile(baseDir + `/docs/public/icon-${size}.png`);
    } catch (err) {
      console.error(`⚠️ Error generando icono ${size}:`, err.message);
    }
  }

  // generate the favicon
  await sharp(fullPath)
    .resize(64, 64) // Resize to 32x32 pixels for the favicon size
    .toFile(baseDir + `/docs/public/favicon.ico`);
}

async function autocomplete(fm, config) {
  if (!fm.sections) return;

  for (var i = 0; i < fm.sections.length; i++) {
    fm.sections[i].index = i;
    if (fm.sections[i].links) {
      fm.sections[i].elements = await Promise.all(fm.sections[i].links.map((url) => getPreview(url)));
    }
    if (fm.sections[i]._block == "links") {
      fm.sections[i]._block = "gallery-feature";
      fm.sections[i].type = fm.sections[i].type || "team-cards";
    }
    if (typeof fm.sections[i].html === "string") {
      fm.sections[i].html = md.render(fm.sections[i].html);
      fm.sections[i].type = "text";
      fm.sections[i]._block = "gallery";
    }
    if (fm.sections[i].elements && fm.sections[i].elements[0]?.html) {
      for (var j = 0; j < fm.sections[i].elements.length; j++) {
        fm.sections[i].elements[j].html = md.render(fm.sections[i].elements[j].html);
      }
    }

    if (fm.sections[i]._block == "links") {
      fm.sections[i]._block = "gallery";
      fm.sections[i].type = "team-cards";
      fm.sections[i].grid = "small";
    } else if (fm.sections[i].list) {
      fm.sections[i].elements = fm.sections[i].list.map((i) => {
        return {
          title: "",
          description: "",
          image: i,
        };
      });
      fm.sections[i].type = "gallery";
      fm.sections[i].grid = "tiny";
    } else if (fm.sections[i]._block == "gospel") {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      try {
        const data = await fetch(`https://gxvchjojub.execute-api.eu-west-1.amazonaws.com/production/getmissafreecontent?lang=es&day=${dateStr}`);
        fm.sections[i].gospel = await data.json();
      } catch (e) {}
    }
    fm.sections[i].grid = grid(fm.sections[i]);
  }
}

function grid(section) {
  if (section.grid == "tiny") {
    return "container mx-auto flex flex-wrap justify-center text-center py-4 *:w-1/3 *:sm:w-1/4 *:md:w-1/5 *:p-1";
  }
  if (section.grid == "small") {
    return "container mx-auto flex flex-wrap justify-center text-center py-4 *:w-1/2 *:sm:w-1/3 *:md:w-1/4 *:p-2";
  }
  if (section._block == "video-channel") {
    return "container mx-auto flex flex-nowrap overflow-x-scroll *:flex-shrink-0 py-4 *:w-full *:sm:w-1/2 *:md:w-1/3 *:p-2 px-2 video-channel";
  }
  return "container mx-auto flex flex-wrap justify-center text-center py-4 *:w-full *:sm:w-1/2 *:md:w-1/3 *:p-2 px-2";
}

function addMeta(fm, config) {
  fm.head ??= [];
  fm.head.push(["meta", { property: "og:type", content: "website" }], ["meta", { property: "og:title", content: fm.title || config.title }], ["meta", { property: "og:description", content: fm.description || config.description }], ["meta", { property: "og:image", content: fm.image || config.image }], ["name", { property: "twitter:card", content: fm.image || config.image }]);
}

function googleFont(theme, weights = "400,700", styles = "normal,italic") {
  // Google Fonts URL format
  const baseURL = "https://fonts.googleapis.com/css2";
  return `${baseURL}?family=${theme.bodyFont.replace(/\s+/g, "+")}&family=${theme.headingFont.replace(/\s+/g, "+")}&display=swap`;
}

const getHue = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  if (d === 0) return 0;
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return h * 60;
};

async function printCSS(config) {
  let css = `/* global.css or in your <style> block */


@theme {
  /* === Your core parameters === */
  --font-body: '${config.theme.bodyFont}', sans-serif;
  --font-heading: '${config.theme.headingFont}', sans-serif;
  --color-accent: ${config.theme.accentColor};
  --color-primary: ${config.theme.accentPrimary};
  --border-radius-mult: ${config.theme.borderRadius};
  --border-width-mult: ${config.theme.borderWidth};
  --shadow-depth-mult: ${config.theme.shadowDepth};
  --accent-angle: ${getHue(config.theme.accentColor)}deg;

    
  /* === Derived Tailwind vars (reactive) === */

    /* Radius */
    --radius-sm: calc(0.125rem * var(--border-radius-mult));
    --radius: calc(0.25rem * var(--border-radius-mult));
    --radius-md: calc(0.375rem * var(--border-radius-mult));
    --radius-lg: calc(0.5rem * var(--border-radius-mult));
    --radius-xl: calc(0.75rem * var(--border-radius-mult));
    --radius-2xl: calc(1rem * var(--border-radius-mult));
    --radius-3xl: calc(1.5rem * var(--border-radius-mult));
    --radius-full: 9999px;

    /* Border widths */
    --border-width: calc(1px * var(--border-width-mult));
    --border-width-2: calc(2px * var(--border-width-mult));
    --border-width-4: calc(4px * var(--border-width-mult));
    --border-width-8: calc(8px * var(--border-width-mult));

    /* Shadows */
    --shadow-color: 0 0% 0% / 0.15;
    --shadow-sm: 0 calc(1px * var(--shadow-depth-mult)) calc(2px * var(--shadow-depth-mult)) hsl(var(--shadow-color));
    --shadow: 0 calc(1px * var(--shadow-depth-mult)) calc(3px * var(--shadow-depth-mult)) hsl(var(--shadow-color)),
              0 calc(1px * var(--shadow-depth-mult)) calc(2px * var(--shadow-depth-mult)) hsl(var(--shadow-color));
    --shadow-md: 0 calc(4px * var(--shadow-depth-mult)) calc(6px * var(--shadow-depth-mult)) -1px hsl(var(--shadow-color)),
                 0 calc(2px * var(--shadow-depth-mult)) calc(4px * var(--shadow-depth-mult)) -2px hsl(var(--shadow-color));
    --shadow-lg: 0 calc(10px * var(--shadow-depth-mult)) calc(15px * var(--shadow-depth-mult)) -3px hsl(var(--shadow-color)),
                 0 calc(4px * var(--shadow-depth-mult)) calc(6px * var(--shadow-depth-mult)) -4px hsl(var(--shadow-color));
    --shadow-xl: 0 calc(20px * var(--shadow-depth-mult)) calc(25px * var(--shadow-depth-mult)) -5px hsl(var(--shadow-color)),
                 0 calc(10px * var(--shadow-depth-mult)) calc(10px * var(--shadow-depth-mult)) -5px hsl(var(--shadow-color));

    /* Apply directly to Tailwind font vars */
    --font-sans: var(--font-body);
    --font-display: var(--font-heading);
  }

/* You can also include other global styles */
body {
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

.prose-serious * {
  opacity: 1 !important;          /* fully visible */
  color: black !important;
  transform: scale(1) rotate(0) translate(0)  !important; /* no scaling or translation */
}

@keyframes scrolled {
  to {
    opacity: 1;          /* fully visible */
    transform: scale(1) rotate(0) translate(0); /* no scaling or translation */
  }
}\n\n`;

  config.theme.styles.forEach(({ selector, cssClass, scroll }) => {
    if (scroll) {
      css += `${selector} {
  ${cssClass};
  animation: scrolled linear both;
  animation-timeline: view();
  animation-range: entry 30% cover 30%;
}\n\n`;
    } else {
      css += `${selector} {  ${cssClass}; }\n\n`;
    }
  });

  const baseDir = path.resolve("");
  fs.writeFileSync(baseDir + "/docs/.vitepress/theme/vars.css", css, "utf8");
}

export async function generate() {
  let config = readFrontmatter("./docs/config.json");

  config.languages = [
    { code: "es", label: "Español", path: "/" },
    { code: "en", label: "English", path: "en/" },
    { code: "eus", label: "Euskara", path: "eus/" },
  ];

  config.goatcounter = "https://vocacion.goatcounter.com/count";

  await printCSS(config);
  const FONT_URL = googleFont(config.theme);

  async function getFontCSS(url) {
    const res = await fetch(url);
    let css = await res.text();
    if (!css.includes("font-display")) css = css.replace(/}/g, "font-display:swap;}");
    return css;
  }

  await createManifest(config);

  return {
    head: [
      // Preconnect to Google Fonts and Fonts CDN
      //["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
      ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" }],
      // Link to the Google Font stylesheet
      ["style", {}, await getFontCSS(FONT_URL)],
      ["link", { rel: "manifest", href: "/manifest.json" }],
      ["link", { rel: "icon", href: "/favicon.ico", type: "image/x-icon" }],
      ["script", { "data-goatcounter": config.goatcounter, async: true, src: "//gc.zgo.at/count.js" }],
    ],
    title: config.title,
    cleanUrls: true,
    description: config.description,
    themeConfig: {
      nav: await generateNav(config),
      languages: config.languages,
      config: config,
    },
    async transformPageData(pageData) {
      const fm = pageData.frontmatter;
      if (fm) await autocomplete(fm, config);
      return pageData;
    },
  };
}
