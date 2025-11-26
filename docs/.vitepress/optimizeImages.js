import fg from "fast-glob";
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const MEDIA_DIR = "docs/public/media";
const ROOT_DIR = "docs/public";
const HQ_DIR = "docs/public/media/hq";

async function processImage(imgPath) {
  const ext = path.extname(imgPath).toLowerCase();
  const filename = path.basename(imgPath);
  const base = imgPath.slice(0, -ext.length);
  const newImg = `${base}.webp`;

  if (/icon-\d+\.png$/.test(filename)) {
    console.log(`⚪ Skipped ${filename} (icon file)`);
    return;
  }

  try {
    const image = sharp(imgPath);
    const metadata = await image.metadata();

    // ⛔ Skip if WebP and width ≤ 1080
    if (ext === ".webp" && metadata.width <= 1080) {
      console.log(`⚪ Skipped ${filename} (already webp ≤1080px)`);
      return;
    }

    // Move original to /hq/
    await fs.mkdir(HQ_DIR, { recursive: true });
    const destHQ = path.join(HQ_DIR, filename);
    await fs.rename(imgPath, destHQ);

    // Prepare resized output
    const src = sharp(destHQ);
    const shouldResize = metadata.width > 1080;

    if (shouldResize) {
      await src.resize(1080).webp({ quality: 85 }).toFile(newImg);
    } else {
      await src.webp({ quality: 85 }).toFile(newImg);
    }

    // Update references in .vue and .md
    const replaceTargets = await fg(["../**/*.vue", "../**/*.md"], {
      cwd: ROOT_DIR,
      absolute: true,
    });

    for (const file of replaceTargets) {
      const content = await fs.readFile(file, "utf8");
      const imgName = path.basename(base); // e.g. "foo" from "foo.jpg"
      const oldPattern = new RegExp(`/media/${imgName}\\.${ext.slice(1)}`, "g");
      const newRef = `/media/${imgName}.webp`;

      if (oldPattern.test(content)) {
        const updated = content.replace(oldPattern, newRef);
        await fs.writeFile(file, updated, "utf8");
      }
    }

    console.log(`✅ ${filename}: moved → hq, ${shouldResize ? "resized" : "re-encoded"} → ${newImg}`);
  } catch (err) {
    console.error(`❌ Failed on ${imgPath}: ${err.message}`);
  }
}

(async () => {
  // Include all images but ignore /hq/
  const images = await fg(["**/*.{jpg,jpeg,png,gif,webp}", "!hq/**"], {
    cwd: MEDIA_DIR,
    absolute: true,
    dot: false,
  });

  for (const img of images) {
    await processImage(img);
  }
})();
