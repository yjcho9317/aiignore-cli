import fs from 'node:fs';
import path from 'node:path';
import type { GeneratorResult, WriteMode } from './index.js';
import { buildIgnoreFile, appendPatterns, skipResult } from './cursorignore.js';

export function generateGeminiignore(
  projectDir: string,
  patterns: string[],
  mode: WriteMode,
): GeneratorResult {
  const filePath = path.join(projectDir, '.geminiignore');
  const exists = fs.existsSync(filePath);

  if (exists && mode === 'default') {
    return skipResult('geminiCli', 'Gemini CLI', '.geminiignore');
  }

  if (exists && mode === 'append') {
    const added = appendPatterns(filePath, patterns);
    return {
      toolId: 'geminiCli', toolName: 'Gemini CLI', filePath: '.geminiignore',
      created: added > 0, skipped: added === 0,
      message: added > 0 ? `${added} pattern(s) added` : 'No new patterns to add',
    };
  }

  const content = buildIgnoreFile('Gemini CLI', '.geminiignore', patterns, [
    'NOTE: Negation patterns (!) are broken in Gemini CLI.',
    'list_dir may ignore .geminiignore in Antigravity mode.',
  ]);

  fs.writeFileSync(filePath, content, 'utf-8');

  return {
    toolId: 'geminiCli', toolName: 'Gemini CLI', filePath: '.geminiignore',
    created: true, skipped: false,
    message: 'Negation patterns broken',
  };
}
