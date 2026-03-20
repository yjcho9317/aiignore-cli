import fs from 'node:fs';
import path from 'node:path';
import { resolveToolIds } from './aliases.js';
import { logger } from './logger.js';

const EMPTY_CONFIG = { extraPatterns: [] as string[], toolIds: null as string[] | null };

export function loadConfig(projectDir: string) {
  const configPath = path.join(projectDir, '.aiignorerc');
  if (!fs.existsSync(configPath)) return EMPTY_CONFIG;

  let raw: { extraPatterns?: string[]; tools?: string[] };
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    logger.warn('.aiignorerc has invalid JSON — ignoring');
    return EMPTY_CONFIG;
  }

  const extraPatterns = Array.isArray(raw.extraPatterns) ? raw.extraPatterns : [];

  let toolIds: string[] | null = null;
  if (Array.isArray(raw.tools) && raw.tools.length > 0) {
    const { ids, invalid } = resolveToolIds(raw.tools.join(','));
    if (invalid.length > 0) {
      logger.warn(`.aiignorerc: unknown tool(s): ${invalid.join(', ')}`);
    }
    if (ids.length > 0) toolIds = ids;
  }

  return { extraPatterns, toolIds };
}
