import fs from 'node:fs';
import chalk from 'chalk';
import { getGlobalConfigPath, loadConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export function configCommand(sub?: string): void {
  const globalPath = getGlobalConfigPath();

  if (sub === 'path') {
    console.log(globalPath);
    return;
  }

  // default: show effective config
  const projectDir = process.cwd();
  const config = loadConfig(projectDir);
  const globalExists = fs.existsSync(globalPath);
  const projectExists = fs.existsSync(`${projectDir}/.aiignorerc`);

  console.log();
  logger.heading('Configuration');
  console.log();
  console.log(`  Global:  ${globalExists ? chalk.green(globalPath) : chalk.dim(`${globalPath} (not found)`)}`);
  console.log(`  Project: ${projectExists ? chalk.green('.aiignorerc') : chalk.dim('.aiignorerc (not found)')}`);
  console.log();

  if (config.extraPatterns.length > 0) {
    console.log(chalk.bold('  Extra patterns:'));
    for (const p of config.extraPatterns) {
      console.log(`    ${p}`);
    }
  } else {
    console.log(chalk.dim('  No extra patterns configured.'));
  }

  if (config.toolIds) {
    console.log();
    console.log(chalk.bold('  Tools:'));
    console.log(`    ${config.toolIds.join(', ')}`);
  }

  console.log();
}
