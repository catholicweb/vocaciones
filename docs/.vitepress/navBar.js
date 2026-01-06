import { slugify } from "./utils.js";
import { read, write, fg, path } from "./node_utils.js";

export function locales(languages) {
  const loc = {};
  for (var i = 0; i < languages.length; i++) {
    const label = languages[i].split(":")[0];
    const lang = languages[i].split(":")[1];
    const key = i === 0 ? "root" : lang;
    loc[key] = { label, lang };
  }
  return loc;
}

const docsDir = path.resolve("./docs");

export async function generateNav(config) {
  if (config?.nav?.length) return generateManualNav(config);

  // Otherwise, generate automatically
  const files = await fg(["**/*.md", "!aviso-legal*"], { cwd: docsDir, absolute: false });
  const nav = files.reduce((acc, f) => {
    const { data } = read(`docs/${f}`);
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
  return nav;
}

function tr(str, lang) {
  console.log("Remember to translate section titles", str, lang);
  return str;
}

function getEquiv(file) {
  if (path.basename(file) == "index.md") return read("./docs/index.md").data;
  let original = read("./" + file).data;
  let equiv = slugify(original.title);
  return read("./docs/" + equiv + ".md").data;
}

async function generateManualNav(config) {
  let nav = {};
  config.nav.forEach((section) => {
    let items = {};
    section.links.forEach((file) => {
      const data = getEquiv(file);
      if (!data.equiv) {
        console.log("[generateManualNav] Missing file: ", file);
        return;
      }
      data.equiv.forEach((equiv) => {
        const linkEquiv = read("./docs" + equiv.href + ".md").data;
        if (!items[equiv.lang]) items[equiv.lang] = [];
        items[equiv.lang].push({ text: linkEquiv.title, link: equiv.href });
      });
    });
    for (const lang in items) {
      if (!nav[lang]) nav[lang] = [];
      nav[lang].push({ text: tr(section.title, lang), items: items[lang] });
    }
  });
  return nav;
}
