import { generateCursorignore } from './cursorignore.js';
import { generateClaudeSettings } from './claude-settings.js';
import { generateCopilotGuide } from './copilot-guide.js';
import { generateGeminiignore } from './geminiignore.js';
import { generateCodeiumignore } from './codeiumignore.js';
import { generateAiignoreJB } from './aiignore-jb.js';

export type WriteMode = 'default' | 'force' | 'append';

export interface GeneratorResult {
  toolId: string;
  toolName: string;
  filePath: string;
  created: boolean;
  skipped: boolean;
  message: string;
}

type GeneratorFn = (projectDir: string, patterns: string[], mode: WriteMode) => GeneratorResult;

const generators: Record<string, GeneratorFn> = {
  cursor: generateCursorignore,
  claudeCode: generateClaudeSettings,
  copilot: generateCopilotGuide,
  geminiCli: generateGeminiignore,
  jetbrains: generateAiignoreJB,
  windsurf: generateCodeiumignore,
};

export function runGenerators(
  projectDir: string,
  patterns: string[],
  toolIds: string[],
  mode: WriteMode,
): GeneratorResult[] {
  const results: GeneratorResult[] = [];

  for (const toolId of toolIds) {
    const generator = generators[toolId];
    if (generator) {
      results.push(generator(projectDir, patterns, mode));
    }
  }

  return results;
}
