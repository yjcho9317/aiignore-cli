import fs from 'node:fs';
import path from 'node:path';
import type { GeneratorResult, WriteMode } from './index.js';

// tracks the deny entries we generated, so --force can drop ours without
// touching the user's hand-added Read() rules
const MANAGED_FILE = 'aiignore-managed.json';

export function generateClaudeSettings(
  projectDir: string,
  patterns: string[],
  mode: WriteMode,
): GeneratorResult {
  const settingsDir = path.join(projectDir, '.claude');
  const settingsPath = path.join(settingsDir, 'settings.json');
  const managedPath = path.join(settingsDir, MANAGED_FILE);

  const settingsExisted = fs.existsSync(settingsPath);
  let existing: Record<string, unknown> = {};
  if (settingsExisted) {
    try {
      existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
      // don't overwrite invalid JSON — that would destroy the user's settings
      return claudeResult(false, 'Existing settings.json has invalid JSON — fix it and re-run');
    }
  }

  const existingPerms = (existing.permissions ?? {}) as Record<string, unknown>;
  const existingDeny = (existingPerms.deny ?? []) as string[];

  let prevManaged = new Set<string>();
  if (fs.existsSync(managedPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(managedPath, 'utf-8'));
      if (Array.isArray(data?.deny)) prevManaged = new Set<string>(data.deny);
    } catch {
      // corrupt marker → treat as empty, which preserves the user's rules
    }
  }

  const aiignorePatterns = patterns.map((p) => `Read(${p})`);

  // --force: drop only our own previous patterns (from the sidecar), keep the user's
  // --append / default: merge, never remove
  const userDeny = mode === 'force'
    ? existingDeny.filter((d) => !prevManaged.has(d))
    : existingDeny;
  const newDeny = [...new Set([...userDeny, ...aiignorePatterns])];

  // idempotent: an unchanged file stays 'skipped', not re-reported as 'created'
  if (settingsExisted && mode !== 'force' && newDeny.length === existingDeny.length) {
    return claudeResult(false, 'Already covers all patterns');
  }

  const merged = {
    ...existing,
    permissions: {
      ...existingPerms,
      deny: newDeny,
    },
  };

  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }
  fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');

  // record what we now own: exactly this run on --force, else accumulate
  const newManaged = mode === 'force'
    ? aiignorePatterns
    : [...new Set([...prevManaged, ...aiignorePatterns])];
  fs.writeFileSync(managedPath, JSON.stringify({ deny: newManaged }, null, 2) + '\n', 'utf-8');

  return claudeResult(
    true,
    settingsExisted
      ? 'Updated existing settings.json — hooks recommended for stronger protection'
      : 'Deny patterns added — hooks recommended for stronger protection',
  );
}

function claudeResult(created: boolean, message: string): GeneratorResult {
  return {
    toolId: 'claudeCode', toolName: 'Claude Code',
    filePath: '.claude/settings.json',
    created, skipped: !created, message,
  };
}
