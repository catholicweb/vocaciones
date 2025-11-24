import fs from "fs";
import path from "path";
import matter from "gray-matter";

export default {
  async load() {
    // Carpeta donde están tus .md
    const postsDir = path.resolve("./docs");

    // Arrays donde almacenarás los bloques
    const fundraisings = [];
    const maps = [];

    // Función para recorrer todos los archivos .md
    function loadMarkdownFiles(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          loadMarkdownFiles(fullPath); // Recursión para subcarpetas
        } else if (file.endsWith(".md")) {
          const content = fs.readFileSync(fullPath, "utf-8");
          const { data } = matter(content);

          // Chequea si existe data.sections._block
          if (data.sections && Array.isArray(data.sections)) {
            data.sections.forEach((section) => {
              if (section._block === "fundraising") {
                section.progress = (section.raised / section.goal) * 100;
                fundraisings.push(section);
              }
              if (section._block === "map") {
                section.image = section.image || data.image;
                section.name = section.name || data.title;
                section.link = file.replace(".md", "");
                maps.push(section);
              }
            });
          }
        }
      }
    }
    loadMarkdownFiles(postsDir);
    return { fundraisings, maps };
  },
};
