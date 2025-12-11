import fs from "fs";
import path from "path";
import fg from "fast-glob";
import matter from "gray-matter";
import yaml from "js-yaml";
import { slugify } from "./helpers.js";

const ROOT = "./pages/";
const OUT = "./docs/";
const DICTIONARY = readFrontmatter("./docs/public/dictionary.json");

const config = readFrontmatter("./pages/config.json");
// Lista de lenguas a generar
const TARGET_LANGS = (config.languages?.length ? config.languages : ["Español"]).map(getCode);

// Campos que quieres traducir
const FIELDS = ["title", "description", "html", "name", "action"];

function translateValue(value, dict) {
  if (typeof value === "string") return dict[value] || value;
  return value;
}

function readFrontmatter(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");

  if (filePath.endsWith(".json")) {
    return JSON.parse(content || `${fallback}`);
  }
  return matter(content).data || fallback;
}

// Recursivo
function translateObject(obj, dict) {
  if (Array.isArray(obj)) {
    return obj.map((v) => translateObject(v, dict));
  }
  if (obj && typeof obj === "object") {
    const out = {};
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (FIELDS.includes(k)) out[k] = translateValue(v, dict);
      else out[k] = translateObject(v, dict);
    }
    return out;
  }
  return obj;
}

async function cleanDir(dir) {
  const files = await fg(["**/*.md", "!aviso-legal.md"], { cwd: OUT, absolute: true });
  for (const file of files) {
    fs.unlinkSync(file);
  }
}

function getCode(lang) {
  const languageToCodeMap = {
    // Romance Languages (Ibero-Romance)
    Español: "es", // Spanish
    Catalán: "ca", // Catalan
    Gallego: "ga", // Galician
    Portugués: "pt", // Portuguese
    Rumano: "ro", // Romanian

    // Germanic Languages
    Inglés: "en", // English
    Alemán: "de", // German

    // Other European Languages
    Euskera: "eus", // Basque
    Francés: "fr", // French
    Italiano: "it", // Italian
    Búlgaro: "bg", // Bulgarian
    Polaco: "pl", // Polish

    // Other Global Languages
    Árabe: "ar", // Arabic
    Chino: "zh", // Chinese (often zh-Hans or zh-Hant is preferred for clarity)
  };
  return languageToCodeMap[lang] || lang.slice(0, 2).toLowerCase();
}

function filename(file, title, lang) {
  let code = TARGET_LANGS[0] == lang ? "" : lang + "/";
  if (path.basename(file) == "index.md") return code + path.parse(file).name;
  const dict = DICTIONARY[lang] || {};
  return code + slugify(translateValue(title, dict));
}

async function run() {
  await cleanDir("./docs/");
  const files = await fg(["**/*.md", "!aviso-legal.md"], { cwd: ROOT, absolute: true });

  for (const file of files) {
    const original = matter.read(file);

    for (const lang of TARGET_LANGS) {
      const dict = DICTIONARY[lang] || {};
      const translatedData = translateObject(original.data, dict);
      translatedData.lang = lang;
      translatedData.equiv = TARGET_LANGS.map((lan) => {
        return { lang: lan, href: "/" + filename(file, original.data.title, lan) };
      });

      const outContent = matter.stringify(original.content, translatedData, { language: "yaml", yamlOptions: { lineWidth: -1 } });

      const fname = filename(file, original.data.title, lang) + ".md";
      const dest = path.join(OUT, fname);

      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, outContent, "utf8");

      console.log(`→ ${fname}`);
    }
  }
}

run();
