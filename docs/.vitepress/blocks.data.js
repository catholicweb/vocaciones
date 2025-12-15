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

    const files = await fg("**/*.md", { cwd: postsDir, absolute: false });

    for (const file of files) {
      const content = fs.readFileSync("./docs/" + file, "utf-8");
      const { data } = matter(content);
      // Chequea si existe data.sections._block
      if (data.sections && Array.isArray(data.sections)) {
        data.sections.forEach((section) => {
          if (section._block === "fundraising") {
            section.lang = data.lang;
            section.progress = (section.raised / section.goal) * 100;
            fundraisings.push(section);
          } else if (section._block === "map") {
            section.lang = data.lang;
            section.image = section.image || data.image;
            section.name = section.name || data.title;
            section.url = "./" + file.replace(/index\.md$/, "").replace(/\.md$/, "");
            maps.push(section);
          }
        });
      }
    }

    return { fundraisings, maps };
  },
};
