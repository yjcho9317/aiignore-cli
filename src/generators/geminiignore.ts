import { createIgnoreGenerator } from './cursorignore.js';

export const generateGeminiignore = createIgnoreGenerator({
  toolId: 'geminiCli',
  toolName: 'Gemini CLI',
  fileName: '.geminiignore',
  warnings: [
    'NOTE: Negation patterns (!) are broken in Gemini CLI.',
    'list_dir may ignore .geminiignore in Antigravity mode.',
  ],
  message: 'Negation patterns broken',
});
