import fs from 'node:fs';
import path from 'node:path';
import type { GeneratorResult, WriteMode } from './index.js';
import { buildIgnoreFile, appendPatterns, skipResult } from './cursorignore.js';

export function generateCodeiumignore(
  projectDir: string,
  patterns: string[],
  mode: WriteMode,
): GeneratorResult {
  const filePath = path.join(projectDir, '.codeiumignore');
  const exists = fs.existsSync(filePath);

  if (exists && mode === 'default') {
    return skipResult('windsurf', 'Windsurf/Codeium', '.codeiumignore');
  }

  if (exists && mode === 'append') {
    const added = appendPatterns(filePath, patterns);
    return {
      toolId: 'windsurf', toolName: 'Windsurf/Codeium', filePath: '.codeiumignore',
      created: added > 0, skipped: added === 0,
      message: added > 0 ? `${added} pattern(s) added` : 'No new patterns to add',
    };
  }

  const content = buildIgnoreFile('Windsurf/Codeium', '.codeiumignore', patterns, [
    'NOTE: Negation (!) cannot override .gitignore exclusions (Issue #133).',
    'Still uses .codeiumignore (not .windsurfignore).',
  ]);

  fs.writeFileSync(filePath, content, 'utf-8');

  return {
    toolId: 'windsurf', toolName: 'Windsurf/Codeium', filePath: '.codeiumignore',
    created: true, skipped: false,
    message: 'Negation cannot override .gitignore',
  };
}
