import fs from "fs";
import path from "path";
import fg from "fast-glob";
import matter from "gray-matter";

export { fg };

export { path };

export { fs };

export function read(filename, fallback = {}) {
  try {
    const content = fs.readFileSync(filename, "utf8");

    if (filename.endsWith(".json")) {
      return JSON.parse(content) || fallback;
    }
    return matter(content) || fallback;
  } catch (e) {
    console.error(e);
    return fallback;
  }
}

export function write(filename, data = {}, content = "") {
  let outContent = {};
  if (filename.endsWith(".md")) {
    outContent = matter.stringify(content, data, { language: "yaml", yamlOptions: { lineWidth: -1 } });
  } else {
    outContent = JSON.stringify(data, null, 2);
  }
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, outContent, "utf8");
}
