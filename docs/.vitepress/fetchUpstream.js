#!/usr/bin/env node
import { execSync } from "node:child_process";

function sh(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function fetchUpstream() {
  // 2) Configurar Git
  sh(`git config user.name "github-actions[bot]"`);
  sh(`git config user.email "github-actions[bot]@users.noreply.github.com"`);

  // 3) Añadir remote upstream (si ya existe, simplemente falla → bien)
  sh(`git remote add upstream https://github.com/catholicweb/web-template.git || true`);
  sh(`git fetch upstream`);

  // 4) Merge plantilla excluyendo workflows
  sh(`git merge upstream/main --no-commit -X theirs --allow-unrelated-histories`);

  // 4b) Quitar workflows del staging (si no existen, no pasa nada)
  sh(`git reset .github/workflows || true`);
  sh(`git reset docs/index.md || true`);
  sh(`git reset docs/config.json || true`);
  sh(`git reset docs/events.json || true`);

  // 4c) Commit (si no hay cambios, fallo → también bien)
  sh(`git commit -m "Sync template changes" || true`);

  // 5) Push final
  sh(`git push origin main`);

  console.log("Sync complete.");
}

const eventName = process.env.EVENT_NAME;
const schedule = process.env.EVENT_SCHEDULE;

if (schedule == "0 3 * * *") {
  fetchUpstream();
} else {
  console.log("Not the right time to fetch...");
}
