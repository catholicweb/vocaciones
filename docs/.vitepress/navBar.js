import fg from "fast-glob";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

function slugify(str) {
  return str
    .normalize("NFD") // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // cualquier cosa rara → guion
    .replace(/^-+|-+$/g, ""); // limpia bordes
}

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
  console.log(config, config?.nav, config?.nav?.length);
  if (config?.nav?.length) return generateManualNav(config);
  const files = await fg(["**/*.md", "!aviso-legal.md"], { cwd: docsDir, absolute: false });

  const nav = files.map((f) => {
    const raw = fs.readFileSync("docs/" + f, "utf8");
    const { data } = matter(raw);
    const baseLink = "./" + f.replace(/index\.md$/, "").replace(/\.md$/, "");

    const items = (data.sections ?? [])
      .filter((s) => s?.title && s.title.trim() !== "")
      .map(({ title }) => ({
        text: title.trim(),
        link: `${baseLink}#${slugify(title)}`,
      }));

    return items.length ? { text: data.title ?? path.basename(baseLink), items } : { text: data.title ?? path.basename(baseLink), link: baseLink };
  });
  return nav.length === 1 ? nav[0].items : nav;
}

async function generateManualNav(config) {
  // Build VitePress nav
  return config.nav.map((section) => ({
    text: section.title,
    items: section.links.map((linkPath) => ({
      text: readFrontmatter(linkPath)?.title || path.basename(linkPath, ".md"),
      link: "/" + linkPath.replace(/^docs\//, "").replace(/\.md$/, ""),
    })),
  }));
}

/** Genera el árbol de navegación */
async function generateNav3() {
  const files = fg.sync(["**/*.md"], {
    cwd: "./docs/",
    ignore: ["node_modules", ".vitepress", "index.md"],
  });

  const posts = files.map((file) => {
    const parts = file.split("/").filter(Boolean);

    // Leer frontmatter
    const content = fs.readFileSync(`./docs/${file}`, "utf-8");
    const { data } = matter(content);
    const title = data.title || parts[parts.length - 1].replace(".md", "");

    return { file, parts, title };
  });

  const tree = [];

  const insertNode = (tree, parts, file, title) => {
    const [head, ...tail] = parts;
    if (!head) return;
    let node = tree.find((n) => n.key === head);
    if (!node) {
      node = { key: head, title: head, children: [], posts: [] };
      tree.push(node);
    }
    if (tail.length === 0) node.posts.push({ file, title });
    else insertNode(node.children, tail, file, title);
  };

  for (const post of posts) insertNode(tree, post.parts, post.file, post.title);

  const sortTree = (nodes) => {
    nodes.sort((a, b) => a.title.localeCompare(b.title));
    nodes.forEach((n) => sortTree(n.children));
  };
  sortTree(tree);

  const toVitepressNav = (nodes) =>
    nodes.map((n) => {
      if (n.children.length === 0) {
        const items = n.posts.map((p) => ({
          text: p.title.replaceAll("-", " "),
          link: "/" + p.file.replace(".md", ".html"),
        }));
        return items.length === 1 ? { text: items[0].text, link: items[0].link } : { text: n.title, items };
      }
      return { text: n.title, items: toVitepressNav(n.children) };
    });

  return toVitepressNav(tree);
}
