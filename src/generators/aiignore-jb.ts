import fs from 'node:fs';
import path from 'node:path';
import type { GeneratorResult, WriteMode } from './index.js';
import { buildIgnoreFile, appendPatterns, skipResult } from './cursorignore.js';

export function generateAiignoreJB(
  projectDir: string,
  patterns: string[],
  mode: WriteMode,
): GeneratorResult {
  const filePath = path.join(projectDir, '.aiignore');
  const exists = fs.existsSync(filePath);

  if (exists && mode === 'default') {
    return skipResult('jetbrains', 'JetBrains AI', '.aiignore');
  }

  if (exists && mode === 'append') {
    const added = appendPatterns(filePath, patterns);
    return {
      toolId: 'jetbrains', toolName: 'JetBrains AI', filePath: '.aiignore',
      created: added > 0, skipped: added === 0,
      message: added > 0 ? `${added} pattern(s) added` : 'No new patterns to add',
    };
  }

  const content = buildIgnoreFile('JetBrains AI', '.aiignore', patterns, [
    'JetBrains native format. Also supports .aiexclude for compatibility.',
  ]);

  fs.writeFileSync(filePath, content, 'utf-8');

  return {
    toolId: 'jetbrains', toolName: 'JetBrains AI', filePath: '.aiignore',
    created: true, skipped: false,
    message: 'Most reliable ignore mechanism',
  };
}
