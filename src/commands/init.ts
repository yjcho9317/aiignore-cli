import ora from 'ora';
import chalk from 'chalk';
import { scanForSecrets } from '../scanners/secret-detector.js';
import { detectTools, ALL_TOOL_IDS } from '../scanners/tool-detector.js';
import { runGenerators } from '../generators/index.js';
import { TOOL_STATUS } from '../data/tool-status.js';
import { resolveToolIds } from '../utils/aliases.js';
import { logger } from '../utils/logger.js';

export interface InitOptions {
  all?: boolean;
  only?: string;
  append?: boolean;
  dryRun?: boolean;
  force?: boolean;
  quiet?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const projectDir = process.cwd();
  const log = options.quiet ? { dim: noop, info: noop, warn: noop, success: noop, heading: noop } : logger;

  const spinner = options.quiet ? null : ora('Scanning project for sensitive files...').start();
  const scanResult = await scanForSecrets(projectDir);
  spinner?.succeed(
    `Found ${scanResult.foundFiles.length} sensitive file(s), ${scanResult.patterns.length} patterns`,
  );

  if (scanResult.foundFiles.length > 0 && !options.quiet) {
    logger.dim('  Found: ' + scanResult.foundFiles.slice(0, 5).join(', ') +
      (scanResult.foundFiles.length > 5 ? ` (+${scanResult.foundFiles.length - 5} more)` : ''));
  }

  const spinnerTools = options.quiet ? null : ora('Detecting AI coding tools...').start();
  const detectedTools = detectTools(projectDir);
  const activeTools = detectedTools.filter((t) => t.detected);

  if (options.all) {
    spinnerTools?.succeed(`Using all ${ALL_TOOL_IDS.length} supported tools`);
  } else if (options.only) {
    const { ids, invalid } = resolveToolIds(options.only);
    if (invalid.length > 0) {
      spinnerTools?.fail(`Unknown tool(s): ${invalid.join(', ')}`);
      logger.info('Run `aiignore list` to see available tools.');
      process.exit(1);
    }
    spinnerTools?.succeed(`Targeting: ${ids.length} tool(s)`);
  } else if (activeTools.length > 0) {
    spinnerTools?.succeed(
      `Detected ${activeTools.length} tool(s): ${activeTools.map((t) => t.name).join(', ')}`,
    );
  } else {
    spinnerTools?.warn('No AI tools detected');
    log.info('Use --all to generate for all tools, or --only to pick specific ones.');
    log.info('Run `aiignore list` to see available tools.');
    return;
  }

  let targetToolIds: string[];
  if (options.all) {
    targetToolIds = ALL_TOOL_IDS;
  } else if (options.only) {
    targetToolIds = resolveToolIds(options.only).ids;
  } else {
    targetToolIds = activeTools.map((t) => t.id);
  }

  if (options.dryRun) {
    log.heading('Dry run — files that would be created:');
    for (const toolId of targetToolIds) {
      const status = TOOL_STATUS[toolId];
      if (status) {
        console.log(`  ${status.ignoreFile === 'none' ? '  guide' : '  ' + status.ignoreFile} (${status.tool})`);
      }
    }
    console.log();
    log.info('Run without --dry-run to create files.');
    return;
  }

  const mode = options.force ? 'force' : options.append ? 'append' : 'default';
  log.heading('Generating ignore files...');
  const results = runGenerators(projectDir, scanResult.patterns, targetToolIds, mode);

  if (!options.quiet) {
    console.log();
    for (const result of results) {
      if (result.skipped) {
        logger.dim(`  skip ${result.filePath} — ${result.message}`);
      } else if (result.created) {
        console.log(`    ${chalk.green('+')} ${chalk.bold(result.filePath)} ${chalk.dim(`(${result.toolName})`)}`);
        if (result.message) {
          logger.dim(`     ${result.message}`);
        }
      }
    }
  }

  const created = results.filter((r) => r.created).length;
  const skipped = results.filter((r) => r.skipped).length;

  if (!options.quiet) {
    console.log();
    logger.success(`${created} file(s) created${skipped > 0 ? `, ${skipped} skipped` : ''}`);
  }

  if (targetToolIds.includes('claudeCode') && !options.quiet) {
    console.log();
    logger.warn('Claude Code: Read() deny blocks Bash cat too, but permissions.deny has known bugs');
    logger.info('For stronger protection, set up PreToolUse hooks:');
    logger.dim('  -> https://code.claude.com/docs/en/hooks');
  }

  if (targetToolIds.includes('copilot') && !options.quiet) {
    console.log();
    logger.warn('Copilot: No file-level protection for individual developers');
    logger.info('See .github/copilot-security-guide.md for alternatives');
  }
}

function noop(_msg: string) {}
