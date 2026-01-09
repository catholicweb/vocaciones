import fg from "fast-glob";
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const MEDIA_DIR = path.resolve("docs/public/media");

const SIZES = {
  sm: { width: 480, quality: 60 },
  md: { width: 768, quality: 70 },
  lg: { width: 1080, quality: 90 },
};

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Checks if the target needs updating based on existence and modification time.
 * Returns true if the output file is missing or older than the source.
 */
async function needsUpdate(sourcePath, targetPath) {
  try {
    const [sourceStat, targetStat] = await Promise.all([fs.stat(sourcePath), fs.stat(targetPath)]);
    // Overwrite if the source was modified after the target was created
    return sourceStat.mtime > targetStat.mtime;
  } catch (err) {
    // If target doesn't exist, stat(targetPath) fails, meaning we need to create it
    return true;
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

    // Check if the file exists AND if it's up to date
    if (!(await needsUpdate(imgPath, outPath))) {
      continue;
    }

    const pipeline = sharp(imgPath).webp({ quality });

    if (metadata.width && metadata.width > width) {
      pipeline.resize(width);
    }

    await pipeline.toFile(outPath);
    console.log(`✔ ${label}/${relPath} (updated)`);
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
