import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveToolIds } from './aliases.js';
import { logger } from './logger.js';

interface AiignoreConfig {
  extraPatterns: string[];
  toolIds: string[] | null;
}

const EMPTY_CONFIG: AiignoreConfig = { extraPatterns: [], toolIds: null };

function parseConfigFile(filePath: string, label: string): { extraPatterns?: string[]; tools?: string[] } | null {
  if (!fs.existsSync(filePath)) return null;

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    logger.warn(`${label} has invalid JSON — ignoring`);
    return null;
  }
}

function resolveConfig(raw: { extraPatterns?: string[]; tools?: string[] }, label: string): AiignoreConfig {
  const extraPatterns = Array.isArray(raw.extraPatterns)
    ? raw.extraPatterns.filter((p) => {
        if (typeof p !== 'string') return false;
        if (p.startsWith('!')) {
          logger.warn(`${label}: negation pattern "${p}" rejected — cannot override security patterns`);
          return false;
        }
        return true;
      })
    : [];

  let toolIds: string[] | null = null;
  if (Array.isArray(raw.tools) && raw.tools.length > 0) {
    const { ids, invalid } = resolveToolIds(raw.tools.join(','));
    if (invalid.length > 0) {
      logger.warn(`${label}: unknown tool(s): ${invalid.join(', ')}`);
    }
    if (ids.length > 0) toolIds = ids;
  }

  return { extraPatterns, toolIds };
}

export function getGlobalConfigPath(): string {
  const xdg = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(xdg, 'aiignore', 'config.json');
}

function loadGlobalConfig(): AiignoreConfig {
  const raw = parseConfigFile(getGlobalConfigPath(), 'Global config');
  return raw ? resolveConfig(raw, 'Global config') : EMPTY_CONFIG;
}

function loadProjectConfig(projectDir: string): AiignoreConfig {
  const raw = parseConfigFile(path.join(projectDir, '.aiignorerc'), '.aiignorerc');
  return raw ? resolveConfig(raw, '.aiignorerc') : EMPTY_CONFIG;
}

export function loadConfig(projectDir: string): AiignoreConfig {
  const global = loadGlobalConfig();
  const project = loadProjectConfig(projectDir);

  // extraPatterns: union (global + project)
  const extraPatterns = [...new Set([...global.extraPatterns, ...project.extraPatterns])];

  // toolIds: project overrides global
  const toolIds = project.toolIds ?? global.toolIds;

  return { extraPatterns, toolIds };
}
