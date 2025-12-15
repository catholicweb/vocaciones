import fs from "fs";
import path from "path";
import fg from "fast-glob";
import matter from "gray-matter";
import { slugify } from "./helpers.js";

const ROOT = "./pages/";
const OUT = "./docs/";
const DICTIONARY = read("./docs/public/dictionary.json");

const config = read("./pages/config.json");
// Lista de lenguas a generar
const TARGET_LANGS = config.languages?.length ? config.languages : ["Español:es"];

// Campos que quieres traducir
const FIELDS = ["title", "description", "html", "name", "action"];

function translateValue(value, dict) {
  if (typeof value === "string") return dict[value] || value;
  return value;
}

function read(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");

  if (filePath.endsWith(".json")) {
    return JSON.parse(content || `${fallback}`);
  }
  return matter(content) || fallback;
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

async function write(filename, data) {
  let outContent = {};
  if (filename.endsWith(".md")) {
    outContent = matter.stringify(data.content || "", data.data || {}, { language: "yaml", yamlOptions: { lineWidth: -1 } });
  } else {
    outContent = JSON.stringify(data);
  }
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, outContent, "utf8");
}

async function cleanDir(dir) {
  const files = await fg(["**/*.md", "!aviso-legal.md"], { cwd: OUT, absolute: true });
  for (const file of files) {
    try {
      const data = read(file, {}).data;
      const source = read(data.source, {}).data;
      const targetUrl = "/" + filename(file, source.title, data.lang).replace("index", "");
      const redirect = {
        source: data.source,
        lang: data.lang,
        head: [
          [
            "meta",
            {
              "http-equiv": "refresh",
              content: `0; url=${targetUrl}`,
            },
          ],
        ],
      };
      write(file, { data: redirect });
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
  await cleanDir("./docs/");
  const files = await fg(["**/*.md", "!aviso-legal.md"], { cwd: ROOT, absolute: false });

  for (const file of files) {
    const original = read(ROOT + file);

    for (const lang of TARGET_LANGS) {
      const dict = DICTIONARY[lang] || {};
      const translatedData = translateObject(original.data, dict);
      translatedData.lang = lang;
      translatedData.source = ROOT + file;
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
