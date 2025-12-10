import fg from "fast-glob";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { slugify } from "./helpers.js";

function readFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");

  if (filePath.endsWith(".json")) {
    return JSON.parse(content || "{}");
  }

  return matter(content).data || {};
}

const docsDir = path.resolve("./docs");

export async function generateNav(config) {
  if (config?.nav?.length) return generateManualNav(config);

  // Otherwise, generate automatically
  const files = await fg(["**/*.md", "!aviso-legal.md"], { cwd: docsDir, absolute: false });
  const nav = files.reduce((acc, f) => {
    const data = readFrontmatter(`docs/${f}`);
    if (!data.lang) return acc;

    const base = "/" + f.replace(/index\.md$/, "").replace(/\.md$/, "");
    const sections = data.sections ?? [];

    const items = sections
      .filter((s) => s?.title?.trim())
      .map((s) => ({
        text: s.title.trim(),
        link: `${base}#${slugify(s.title)}`,
      }));

    const nav = items.length ? { text: data.title, items } : { text: data.title, link: base };

    (acc[data.lang] ??= []).push(nav);
    return acc;
  }, {});

  console.log(nav);

  return nav;
}

function tr(str, lang) {
  console.log("Remember to translate section titles", str, lang);
  return str;
}

async function generateManualNav(config) {
  let nav = {};
  config.nav.forEach((section) => {
    let items = {};
    section.links.forEach((file) => {
      const data = readFrontmatter(file);
      if (!data.equiv) {
        console.log("[generateManualNav] Missing file: ", file);
        return;
      }
      data.equiv.forEach((equiv) => {
        const linkEquiv = readFrontmatter("./docs" + equiv.href + ".md");
        if (!items[equiv.lang]) items[equiv.lang] = [];
        items[equiv.lang].push({ text: linkEquiv.title, link: equiv.href });
      });
    });
    console.log(items);
    for (const lang in items) {
      if (!nav[lang]) nav[lang] = [];
      nav[lang].push({
        text: tr(section.title, lang),
        items: items[lang],
      });
    }
  });
  console.log(nav);
  return nav;
}
