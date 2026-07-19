import chalk from 'chalk';
import { detectTools } from '../scanners/tool-detector.js';
import { TOOL_STATUS } from '../data/tool-status.js';
import { loadConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import fs from 'node:fs';
import path from 'node:path';

export interface VerifyOptions {
  ci?: boolean;
  json?: boolean;
  strict?: boolean;
  quiet?: boolean;
}

// 'guide' = tool has no ignore mechanism (Copilot), so it's not a pass/fail gate.
// 'none' = protectable tool with no ignore file yet.
type Status = 'best-effort' | 'configured' | 'none' | 'guide';

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

export function verifyCommand(options: VerifyOptions): void {
  const projectDir = process.cwd();

  // config lock overrides auto-detection, same precedence as init
  const config = loadConfig(projectDir);
  const detectedTools = detectTools(projectDir);
  const toolIds = config.toolIds ?? detectedTools.filter((t) => t.detected).map((t) => t.id);

  const results: VerifyResult[] = [];

  for (const toolId of toolIds) {
    const status = TOOL_STATUS[toolId];
    if (!status) continue;

    const isGuideOnly = status.ignoreFile === 'none';
    const ignoreExists = checkIgnoreExists(projectDir, toolId, status.ignoreFile);
    const missingPatterns = !isGuideOnly && ignoreExists
      ? checkMissingPatterns(projectDir, toolId, status.ignoreFile)
      : [];

    let protectionStatus: Status;
    if (isGuideOnly) {
      protectionStatus = 'guide';
    } else if (!ignoreExists) {
      protectionStatus = 'none';
    } else if (status.reliability === 'high') {
      protectionStatus = 'best-effort';
    } else {
      protectionStatus = 'configured';
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

  // Decide the gate before output so --json composes with --ci/--strict
  // (previously --json returned early and skipped it).
  const unprotected = results.filter((r) => r.status === 'none');
  const incomplete = results.filter((r) => r.status !== 'guide' && r.missingPatterns.length > 0);
  const ciFails = unprotected.length > 0;
  const strictFails = unprotected.length > 0 || incomplete.length > 0;

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else if (!options.quiet) {
    printReport(results, options);
  }

  if (options.ci && ciFails) process.exit(1);
  if (options.strict && strictFails) process.exit(1);
}

// interactive only — caller already gated on !json && !quiet
function printReport(results: VerifyResult[], options: VerifyOptions): void {
  if (results.length === 0) {
    logger.warn('No AI tools detected in this project.');
    logger.info('Run `aiignore init --all` to generate ignore files for all tools.');
    return;
  }

  logger.heading('AI Tool Protection Status');
  console.log();

  for (const r of results) {
    console.log(`  ${chalk.bold(r.tool.padEnd(20))} ${statusLabel(r.status)}`);
    if (r.status === 'guide') {
      logger.dim('    No ignore file — see generated guide for alternatives');
    } else if (r.exists) {
      logger.dim(`    File: ${r.ignoreFile}`);
    } else if (r.ignoreFile !== 'none') {
      logger.dim(`    Missing: ${r.ignoreFile}`);
    }
    if (r.missingPatterns.length > 0) {
      console.log(chalk.yellow(`    Missing patterns: ${r.missingPatterns.join(', ')}`));
    }
    if (r.limitations.length > 0 && !options.ci) {
      logger.dim(`    Limitation: ${r.limitations[0]}`);
    }
  }

  const bestEffortCount = results.filter((r) => r.status === 'best-effort').length;
  const configuredCount = results.filter((r) => r.status === 'configured').length;
  const noneCount = results.filter((r) => r.status === 'none').length;
  const guideCount = results.filter((r) => r.status === 'guide').length;
  console.log();
  logger.info(
    `Coverage: ${bestEffortCount} best-effort | ${configuredCount} configured | ` +
    `${noneCount} unprotected${guideCount > 0 ? ` | ${guideCount} guide-only` : ''}`,
  );

  if (noneCount > 0) {
    console.log();
    logger.info('Run `aiignore init` to improve protection.');
  }
}

function statusLabel(s: Status): string {
  switch (s) {
    case 'best-effort': return chalk.green('[ok] Best-effort');
    case 'configured': return chalk.yellow('[~] Configured (tool has known limits)');
    case 'none': return chalk.red('[x] None');
    case 'guide': return chalk.gray('[i] Guide only (no ignore mechanism)');
    default: return s;
  }
}

function checkIgnoreExists(projectDir: string, toolId: string, ignoreFile: string): boolean {
  if (ignoreFile === 'none') return false;

  // Claude Code has no ignore file — protection means an actual Read() deny
  if (toolId === 'claudeCode') {
    return hasClaudeReadDeny(projectDir);
  }

  return fs.existsSync(path.join(projectDir, ignoreFile));
}

function hasClaudeReadDeny(projectDir: string): boolean {
  const settingsPath = path.join(projectDir, '.claude', 'settings.json');
  if (!fs.existsSync(settingsPath)) return false;
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const deny = settings?.permissions?.deny;
    return Array.isArray(deny) && deny.some((d: string) => d.startsWith('Read('));
  } catch {
    return false;
  }
}

function checkMissingPatterns(projectDir: string, toolId: string, ignoreFile: string): string[] {
  if (toolId === 'claudeCode') {
    return checkClaudePatterns(projectDir);
  }

  const filePath = path.join(projectDir, ignoreFile);
  if (!fs.existsSync(filePath)) return REQUIRED_PATTERNS;

  const activeLines = readActivePatternLines(fs.readFileSync(filePath, 'utf-8'));
  return REQUIRED_PATTERNS.filter((p) => !activeLines.has(p));
}

// skip blanks/comments so a commented-out `# .env` isn't counted as protection
function readActivePatternLines(content: string): Set<string> {
  return new Set(
    content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#')),
  );
}

function checkClaudePatterns(projectDir: string): string[] {
  const settingsPath = path.join(projectDir, '.claude', 'settings.json');
  if (!fs.existsSync(settingsPath)) return REQUIRED_PATTERNS;

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const deny = new Set<string>(settings?.permissions?.deny ?? []);
    return REQUIRED_PATTERNS.filter((p) => !deny.has(`Read(${p})`));
  } catch {
    return REQUIRED_PATTERNS;
  }
}
