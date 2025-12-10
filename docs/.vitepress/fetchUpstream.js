#!/usr/bin/env node
import { execSync } from "node:child_process";

function sh(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function fetchUpstream() {
  // 2) Añadir remote upstream (si ya existe, simplemente falla → bien)
  sh(`git remote add upstream https://github.com/catholicweb/web-template.git || true`);
  sh(`git fetch upstream`);

  // 3) Merge plantilla (sin hacer commit, version remota si hay conflicto)
  sh(`git merge upstream/main --no-commit -X theirs --allow-unrelated-histories`);

  // 4) Quitar workflows... del staging (si no existen, no pasa nada)
  sh(`git reset .github/workflows || true`);
  sh(`git reset pages || true`);

  // 5) Commit (si no hay cambios, fallo → también bien)
  sh(`git commit -m "Sync template changes" || true`);

  // 6) Push final
  sh(`git push origin main`);

  console.log("Sync complete.");
}

const eventName = process.env.EVENT_NAME;
const schedule = process.env.EVENT_SCHEDULE;
const repository = process.env.GITHUB_REPOSITORY;

// 1) Configurar Git
sh(`git config user.name "github-actions[bot]"`);
sh(`git config user.email "github-actions[bot]@users.noreply.github.com"`);

// 5) Commit (si no hay cambios, fallo → también bien)
sh(`git add . || true`);
sh(`git commit -m "commit so far" || true`);

// 6) Push final
sh(`git push origin main`);

if (repository == "catholicweb/web-template") {
  console.log("Do not autofecth...");
} else if (schedule == "0 3 * * *" || eventName == "workflow_dispatch") {
  fetchUpstream();
} else {
  console.log("Not the right time to fetch...");
}
