#!/usr/bin/env node
import { execSync } from "node:child_process";

function sh(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function shOut(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

const eventName = process.env.EVENT_NAME;
const schedule = process.env.EVENT_SCHEDULE;
const repository = process.env.GITHUB_REPOSITORY;

// Configure Git identity
sh(`git config user.name "github-actions[bot]"`);
sh(`git config user.email "github-actions[bot]@users.noreply.github.com"`);

export function fetchUpstream() {
  return
}

export function commit() {
  if (!repository) return;
  sh(`git add . || true`);
  sh(`git commit -m "commit so far" || true`);
  sh(`git push origin main`);
}
