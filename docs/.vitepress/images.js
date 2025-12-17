import fg from "fast-glob";
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const MEDIA_DIR = path.resolve("docs/public/media");

const SIZES = {
  sm: { width: 480, quality: 70 },
  md: { width: 768, quality: 80 },
  lg: { width: 1080, quality: 90 },
};

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function processImage(imgPath) {
  if (/icon-\d+\.png$/i.test(imgPath)) return;

  const image = sharp(imgPath);
  const metadata = await image.metadata();

  const relPath = path.relative(MEDIA_DIR, imgPath);
  const baseName = path.basename(relPath, path.extname(relPath));
  const subDir = path.dirname(relPath);

  for (const [label, { width, quality }] of Object.entries(SIZES)) {
    const outDir = path.join(MEDIA_DIR, label, subDir);
    const outPath = path.join(outDir, `${baseName}.webp`);

    await ensureDir(outDir);
    if (await fileExists(outPath)) continue;

    const pipeline = sharp(imgPath).webp({ quality });

    if (metadata.width && metadata.width > width) {
      pipeline.resize(width);
    }

    await pipeline.toFile(outPath);
    console.log(`✔ ${label}/${relPath}`);
  }
}

export async function createImages() {
  const images = await fg(["**/*.{jpg,jpeg,png,gif,webp}", "!{sm,md,lg}/**"], {
    cwd: MEDIA_DIR,
    absolute: true,
  });

  for (const img of images) {
    try {
      await processImage(img);
    } catch (e) {
      console.error(`✘ ${img}: ${e.message}`);
    }
  }
}
