import chalk from 'chalk';
import { detectTools } from '../scanners/tool-detector.js';
import { TOOL_STATUS } from '../data/tool-status.js';
import { DEFAULT_PATTERNS } from '../data/default-patterns.js';
import { logger } from '../utils/logger.js';
import fs from 'node:fs';
import path from 'node:path';

export interface VerifyOptions {
  ci?: boolean;
  json?: boolean;
  strict?: boolean;
}

type Status = 'best-effort' | 'unreliable' | 'none';

interface VerifyResult {
  tool: string;
  status: Status;
  reliability: string;
  ignoreFile: string;
  exists: boolean;
  missingPatterns: string[];
  limitations: string[];
}

const REQUIRED_PATTERNS = ['.env', '*.pem', '*.key', 'credentials.json'];

export async function verifyCommand(options: VerifyOptions): Promise<void> {
  const projectDir = process.cwd();
  const detectedTools = detectTools(projectDir);
  const results: VerifyResult[] = [];

  for (const tool of detectedTools) {
    if (!tool.detected) continue;

    const status = TOOL_STATUS[tool.id];
    if (!status) continue;

    const ignoreExists = checkIgnoreExists(projectDir, tool.id, status.ignoreFile);
    const missingPatterns = ignoreExists
      ? checkMissingPatterns(projectDir, tool.id, status.ignoreFile)
      : [];

    let protectionStatus: Status;
    if (status.reliability === 'none' || !ignoreExists) {
      protectionStatus = 'none';
    } else if (status.reliability === 'high') {
      protectionStatus = 'best-effort';
    } else {
      protectionStatus = 'unreliable';
    }

    results.push({
      tool: status.tool,
      status: protectionStatus,
      reliability: status.reliability,
      ignoreFile: status.ignoreFile,
      exists: ignoreExists,
      missingPatterns,
      limitations: status.knownLimitations,
    });
  }

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (results.length === 0) {
    logger.warn('No AI tools detected in this project.');
    logger.info('Run `aiignore init --all` to generate ignore files for all tools.');
    return;
  }

  logger.heading('AI Tool Protection Status');
  console.log();

  const statusLabel = (s: Status) => {
    switch (s) {
      case 'best-effort': return chalk.green('[ok] Best-effort');
      case 'unreliable': return chalk.yellow('[!] Unreliable');
      case 'none': return chalk.red('[x] None');
      default: return s;
    }
  };

  for (const r of results) {
    console.log(`  ${chalk.bold(r.tool.padEnd(20))} ${statusLabel(r.status)}`);
    if (r.exists) {
      logger.dim(`    File: ${r.ignoreFile}`);
    } else if (r.ignoreFile !== 'none') {
      logger.dim(`    Missing: ${r.ignoreFile}`);
    }
    if (r.missingPatterns.length > 0) {
      logger.warn(`    Missing patterns: ${r.missingPatterns.join(', ')}`);
    }
    if (r.limitations.length > 0 && !options.ci) {
      logger.dim(`    Limitation: ${r.limitations[0]}`);
    }
  }

  const bestEffortCount = results.filter((r) => r.status === 'best-effort').length;
  const unreliableCount = results.filter((r) => r.status === 'unreliable').length;
  const noneCount = results.filter((r) => r.status === 'none').length;

  console.log();
  logger.info(
    `Coverage: ${bestEffortCount} best-effort | ${unreliableCount} unreliable | ${noneCount} none`,
  );

  if (noneCount > 0 || unreliableCount > 0) {
    console.log();
    logger.info('Run `aiignore init` to improve protection.');
  }

  // --ci: fail on none
  // --strict: fail on none OR unreliable
  if (options.ci && noneCount > 0) {
    process.exit(1);
  }
  if (options.strict && (noneCount > 0 || unreliableCount > 0)) {
    process.exit(1);
  }
}

function checkIgnoreExists(projectDir: string, toolId: string, ignoreFile: string): boolean {
  if (ignoreFile === 'none') return false;

  const filePath = path.join(projectDir, ignoreFile);
  if (fs.existsSync(filePath)) return true;

  // Claude Code uses deny patterns in settings.json instead of a standalone file
  if (toolId === 'claudeCode') {
    const settingsPath = path.join(projectDir, '.claude', 'settings.json');
    if (fs.existsSync(settingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        const deny = settings?.permissions?.deny;
        return Array.isArray(deny) && deny.some((d: string) => d.startsWith('Read('));
      } catch {
        return false;
      }
    }
  }

  return false;
}

function checkMissingPatterns(projectDir: string, toolId: string, ignoreFile: string): string[] {
  if (toolId === 'claudeCode') {
    return checkClaudePatterns(projectDir);
  }

  const filePath = path.join(projectDir, ignoreFile);
  if (!fs.existsSync(filePath)) return REQUIRED_PATTERNS;

  const content = fs.readFileSync(filePath, 'utf-8');
  return REQUIRED_PATTERNS.filter((p) => !content.includes(p));
}

function checkClaudePatterns(projectDir: string): string[] {
  const settingsPath = path.join(projectDir, '.claude', 'settings.json');
  if (!fs.existsSync(settingsPath)) return REQUIRED_PATTERNS;

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const deny: string[] = settings?.permissions?.deny ?? [];
    return REQUIRED_PATTERNS.filter((p) => !deny.some((d) => d.includes(p)));
  } catch {
    return REQUIRED_PATTERNS;
  }
}
