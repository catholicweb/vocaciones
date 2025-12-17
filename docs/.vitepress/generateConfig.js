import { read, write, fs, path } from "./node_utils.js";
import { generateNav } from "./navBar.js";

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

function locales(languages) {
  const loc = {};
  for (var i = 0; i < languages.length; i++) {
    const label = languages[i].split(":")[0];
    const lang = languages[i].split(":")[1];
    const key = i === 0 ? "root" : lang;
    loc[key] = { label, lang };
  }
  return loc;
}

async function getFontCSS(theme) {
  const url = googleFont(theme);
  const res = await fetch(url);
  let css = await res.text();
  if (!css.includes("font-display")) css = css.replace(/}/g, "font-display:swap;}");
  return css;
}

function googleFont(theme) {
  return `https://fonts.googleapis.com/css2?family=${theme.bodyFont.replace(/\s+/g, "+")}&family=${theme.headingFont.replace(/\s+/g, "+")}&display=swap`;
}

export async function generate() {
  let config = read("./pages/config.json");

  config.goatcounter = "https://vocacion.goatcounter.com/count";

  await printCSS(config);

  return {
    head: [
      // Preconnect to Google Fonts CDN
      ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" }],
      // Link to the Google Font stylesheet
      ["style", {}, await getFontCSS(config.theme)],
      ["link", { rel: "manifest", href: "/manifest.json" }],
      ["link", { rel: "icon", href: "/favicon.ico", type: "image/x-icon" }],
      ["script", { "data-goatcounter": config.goatcounter, async: true, src: "//gc.zgo.at/count.js" }],
    ],
    locales: locales(config.languages),
    title: config.title,
    cleanUrls: true,
    description: config.description,
    themeConfig: {
      nav: await generateNav(config),
      config: config,
    },
    async transformPageData(pageData) {
      const fm = pageData.frontmatter;
      //if (fm) await autocomplete(fm, config);
      return pageData;
    },
  };
}
