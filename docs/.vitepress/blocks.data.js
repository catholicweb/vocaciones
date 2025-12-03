import fs from "fs";
import path from "path";
import fg from "fast-glob";
import matter from "gray-matter";

export default {
  async load() {
    // Carpeta donde están tus .md
    const postsDir = path.resolve("./docs");

    // Arrays donde almacenarás los bloques
    const fundraisings = [];
    const maps = [];

    // Función para recorrer todos los archivos .md
    async function loadMarkdownFiles(dir) {
      const files = await fg("**/*.md", {
        cwd: dir,
        absolute: false,
      });

      for (const file of files) {
        const content = fs.readFileSync("./docs/" + file, "utf-8");
        const { data } = matter(content);
        // Chequea si existe data.sections._block
        if (data.sections && Array.isArray(data.sections)) {
          data.sections.forEach((section) => {
            if (section._block === "fundraising") {
              section.progress = (section.raised / section.goal) * 100;
              fundraisings.push(section);
            } else if (section._block === "map") {
              section.image = section.image || data.image;
              section.name = section.name || data.title;
              section.url = "./" + file.replace(/index\.md$/, "").replace(/\.md$/, "");
              maps.push(section);
            }
          });
        }
      }
    }

    await loadMarkdownFiles(postsDir);
    return { fundraisings, maps };
  },
};
