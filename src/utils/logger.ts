import chalk from 'chalk';

export const logger = {
  info(msg: string) {
    console.log(chalk.blue('i'), msg);
  },
  success(msg: string) {
    console.log(chalk.green('+'), msg);
  },
  // stderr, not stdout, so warnings don't corrupt `verify --json` piped to jq
  warn(msg: string) {
    console.error(chalk.yellow('!'), msg);
  },
  error(msg: string) {
    console.error(chalk.red('x'), msg);
  },
  dim(msg: string) {
    console.log(chalk.dim(msg));
  },
  heading(msg: string) {
    console.log();
    console.log(chalk.bold(msg));
  },
};
