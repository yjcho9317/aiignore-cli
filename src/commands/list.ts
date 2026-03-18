import chalk from 'chalk';
import { TOOL_STATUS } from '../data/tool-status.js';
import { TOOL_ALIASES } from '../utils/aliases.js';

export function listCommand(): void {
  console.log();
  console.log(chalk.bold('Supported tools:'));
  console.log();

  for (const [id, status] of Object.entries(TOOL_STATUS)) {
    const reliability = formatReliability(status.reliability);
    const file = status.ignoreFile === 'none' ? chalk.dim('(no ignore file)') : status.ignoreFile;
    console.log(`  ${chalk.bold(status.tool.padEnd(20))} ${file.toString().padEnd(30)} ${reliability}`);
  }

  console.log();
  console.log(chalk.bold('Aliases for --only:'));
  console.log();

  const grouped: Record<string, string[]> = {};
  for (const [alias, toolId] of Object.entries(TOOL_ALIASES)) {
    if (!grouped[toolId]) grouped[toolId] = [];
    grouped[toolId].push(alias);
  }

  for (const [toolId, aliases] of Object.entries(grouped)) {
    const status = TOOL_STATUS[toolId];
    if (status) {
      console.log(`  ${aliases.join(', ').padEnd(35)} ${chalk.dim(status.tool)}`);
    }
  }

  console.log();
}

function formatReliability(level: string): string {
  switch (level) {
    case 'high': return chalk.green(level);
    case 'medium': return chalk.yellow(level);
    case 'low': return chalk.red(level);
    case 'none': return chalk.dim(level);
    default: return level;
  }
}
