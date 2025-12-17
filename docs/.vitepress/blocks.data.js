import { read, write, fg } from "./node_utils.js";

export default {
  async load() {
    // Arrays donde almacenarás los bloques
    const fundraisings = [];
    const maps = [];

    const files = await fg("**/*.md", { cwd: "./docs", absolute: false });

    for (const file of files) {
      const { data } = read("./docs/" + file);
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
            section.url = "/" + file.replace(/index\.md$/, "").replace(/\.md$/, "");
            maps.push(section);
          }
        });
      }
    }

    return { fundraisings, maps };
  },
};
