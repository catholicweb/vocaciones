import { read, write, fg, fs, path } from "./node_utils.js";
import { slugify } from "./utils.js";
import { getPreview } from "./oembed.js";
import { fetchVideos } from "./youtube.js";
import { buildDictionary, translateObject, translateValue } from "./translate.js";
import { createImages } from "./images.js";
import { fetchUpstream, commit } from "./git.js";

const ROOT = "./pages/";
const OUT = "./docs/";
const DICTIONARY = read("./docs/public/dictionary.json");

const config = read("./pages/config.json");
// Lista de lenguas a generar
const TARGET_LANGS = config.languages?.length ? config.languages : ["Español:es"];
import MarkdownIt from "markdown-it";
import sharp from "sharp";

const md = new MarkdownIt({ html: true, linkify: true });

async function createManifest() {
  try {
    const manifest = {
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
    write("./docs/public/manifest.json", manifest);

    // Generate icons
    if (!config.icon) return;
    for (const size of [192, 512]) {
      try {
        await sharp("./docs/public" + config.icon)
          .resize(size, size)
          .png()
          .toFile(`./docs/public/icon-${size}.png`);
      } catch (err) {
        console.error(`⚠️ Error generando icono ${size}:`, err.message);
      }
    }

    // generate the favicon

    await sharp("./docs/public" + config.icon)
      .resize(64, 64) // Resize to 32x32 pixels for the favicon size
      .toFile(`./docs/public/favicon.ico`);
  } catch (e) {
    console.log(e, "failed to createManifest");
  }
}

async function postComplete(fm) {
  if (!fm.sections) return;
  for (var i = 0; i < fm.sections.length; i++) {
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
    if (fm.sections[i].elements && fm.sections[i].elements[0]?.file) {
      fm.sections[i].elements = fm.sections[i].elements.map((elem) => {
        if (elem.file) {
          elem.link = "/" + filename(elem.file, elem.title, fm.lang).replace("index", "");
        }
        return elem;
      });
    }
  }
}

async function autocomplete(fm) {
  console.log("autocomplete: ", fm.title);
  if (!fm.sections) return;
  addMeta(fm);
  for (var i = 0; i < fm.sections.length; i++) {
    fm.sections[i].index = i;
    if (fm.sections[i].links) {
      fm.sections[i].elements = await Promise.all(fm.sections[i].links.map((url) => getPreview(url)));
    }
    if (fm.sections[i]._block == "links") {
      fm.sections[i]._block = "gallery-feature";
      fm.sections[i].type = fm.sections[i].type || "team-cards";
    }

    if (fm.sections[i]._block == "gallery-feature") {
      fm.sections[i].type = "team-cards";
      fm.sections[i].grid = "small";
    } else if (fm.sections[i].list) {
      fm.sections[i].elements = fm.sections[i].list.map((i) => {
        return { title: "", description: "", image: i };
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

function absoluteURL(url) {
  if (url.startsWith("/")) {
    const siteurl = config.siteurl || "";
    return siteurl + url;
  }
  return url;
}

function addMeta(fm) {
  fm.head ??= [];
  fm.head.push(["meta", { property: "og:type", content: "website" }]);
  fm.head.push(["meta", { property: "og:title", content: fm.title || config.title }]);
  fm.head.push(["meta", { property: "og:description", content: fm.description || config.description }]);
  fm.head.push(["meta", { property: "og:image", content: absoluteURL(fm.image || config.image) }]);
  fm.head.push(["name", { property: "twitter:card", content: "summary_large_image" }]);
  fm.head.push(["name", { property: "twitter:image", content: absoluteURL(fm.image || config.image) }]);

  if (!fm?.equiv) return;
  for (var i = 0; i < fm.equiv.length; i++) {
    const hreflang = i == 0 ? "x-default" : fm.equiv[i].lang.split(":").pop();
    fm.head.push(["link", { rel: "alternate", hreflang, href: absoluteURL(fm.equiv[i].href).replace(/index$/, "") }]);
  }
}

async function cleanDir(dir) {
  console.log("Cleaning directory (writing redirects)");
  const files = await fg(["**/*.md", "!aviso-legal.md"], { cwd: dir, absolute: true });
  for (const file of files) {
    try {
      const data = read(file, {}).data;
      const source = read(data.source, {}).data;
      const targetUrl = "/" + filename(file, source.title, data.lang).replace("index", "");
      write(file, {
        source: data.source,
        lang: data.lang,
        head: [["meta", { "http-equiv": "refresh", content: `0; url=${targetUrl}` }]],
      });
    } catch (e) {
      console.log(e);
      fs.unlinkSync(file);
    }
  }
}

function getCode(lang) {
  return lang.split(":")[1] || lang.slice(0, 2).toLowerCase();
}

function filename(file, title, lang) {
  let code = TARGET_LANGS[0] == lang ? "" : getCode(lang) + "/";
  if (path.basename(file) == "index.md") return code + path.parse(file).name;
  const dict = DICTIONARY[lang] || {};
  return code + slugify(translateValue(title, dict));
}

async function run() {
  await fetchUpstream();
  await fetchVideos();

  await buildDictionary();

  await createImages();

  await commit();

  await createManifest();
  await cleanDir(OUT);
  const files = await fg(["**/*.md", "!aviso-legal.md"], { cwd: ROOT, absolute: false });

  for (const file of files) {
    const { data, content } = read(ROOT + file);
    await autocomplete(data);

    for (const lang of TARGET_LANGS) {
      const dict = DICTIONARY[lang] || {};
      const translatedData = translateObject(data, dict);
      translatedData.lang = lang;
      translatedData.source = ROOT + file;
      translatedData.equiv = TARGET_LANGS.map((lan) => {
        return { lang: lan, href: "/" + filename(file, data.title, lan) };
      });

      await postComplete(translatedData);

      const dest = OUT + filename(file, data.title, lang) + ".md";
      write(dest, translatedData);
    }
  }
}

run();
