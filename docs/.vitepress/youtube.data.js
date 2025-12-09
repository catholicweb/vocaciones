import fs from "fs";

function readFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");

  if (filePath.endsWith(".json")) {
    return JSON.parse(content || "[]");
  }
  return matter(content).data || {};
}

export default {
  async load() {
    try {
      const videos = readFrontmatter("./docs/public/videos.json");
      return videos;
    } catch (error) {
      console.error("Error loading youtube data:", error);
    }
    return [];
  },
};
