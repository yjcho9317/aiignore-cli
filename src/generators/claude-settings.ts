import fs from 'node:fs';
import path from 'node:path';
import type { GeneratorResult, WriteMode } from './index.js';
import { logger } from '../utils/logger.js';

export function generateClaudeSettings(
  projectDir: string,
  patterns: string[],
  mode: WriteMode,
): GeneratorResult {
  const settingsDir = path.join(projectDir, '.claude');
  const settingsPath = path.join(settingsDir, 'settings.json');

  let existing: Record<string, unknown> = {};
  if (fs.existsSync(settingsPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
      logger.warn('Existing .claude/settings.json has invalid JSON — creating new');
    }
  }

  const existingPerms = (existing.permissions ?? {}) as Record<string, unknown>;
  const existingDeny = (existingPerms.deny ?? []) as string[];

  const aiignorePatterns = new Set(patterns.map((p) => `Read(${p})`));

  // --force: replace aiignore-generated patterns, keep user's custom ones
  // --append / default: merge with existing
  const userDeny = mode === 'force'
    ? existingDeny.filter((d) => !isAiignorePattern(d))
    : existingDeny;

  const newDeny = [...new Set([
    ...userDeny,
    ...aiignorePatterns,
  ])];

  // Check if anything actually changed
  if (mode === 'append' && newDeny.length === existingDeny.length) {
    return {
      toolId: 'claudeCode', toolName: 'Claude Code',
      filePath: '.claude/settings.json',
      created: false, skipped: true,
      message: 'No new patterns to add',
    };
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

  return {
    toolId: 'claudeCode', toolName: 'Claude Code',
    filePath: '.claude/settings.json',
    created: true, skipped: false,
    message: 'Deny patterns added — hooks recommended for stronger protection',
  };
}

function isAiignorePattern(pattern: string): boolean {
  return pattern.startsWith('Read(') || pattern.startsWith('Bash(cat:') || pattern.startsWith('Bash(cat ');
}
