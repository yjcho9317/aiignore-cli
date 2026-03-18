import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { verifyCommand } from './commands/verify.js';
import { listCommand } from './commands/list.js';

const program = new Command();

program
  .name('aiignore')
  .description('Protect your secrets from AI coding tools')
  .version('1.0.0');

program
  .command('init', { isDefault: true })
  .description('Generate ignore files for detected AI coding tools')
  .option('--all', 'Generate for all supported tools (skip detection)')
  .option('--only <tools>', 'Generate for specific tools (comma-separated)')
  .option('--append', 'Add missing patterns to existing files instead of skipping')
  .option('--dry-run', 'Preview what would be created without writing files')
  .option('--force', 'Overwrite existing ignore files')
  .option('-q, --quiet', 'Suppress non-essential output')
  .action(initCommand);

program
  .command('verify')
  .description('Check protection status for detected AI tools')
  .option('--ci', 'CI mode: exit code 1 if unprotected')
  .option('--strict', 'Strict mode: exit code 1 if any tool is unreliable or unprotected')
  .option('--json', 'Output results as JSON')
  .option('-q, --quiet', 'Suppress non-essential output')
  .action(verifyCommand);

program
  .command('list')
  .description('Show all supported AI tools and aliases')
  .action(listCommand);

program.parse();
