import { createIgnoreGenerator } from './cursorignore.js';

export const generateCodeiumignore = createIgnoreGenerator({
  toolId: 'windsurf',
  toolName: 'Windsurf/Codeium',
  fileName: '.codeiumignore',
  warnings: [
    'NOTE: Negation (!) cannot override .gitignore exclusions (Issue #133).',
    'Still uses .codeiumignore (not .windsurfignore).',
  ],
  message: 'Negation cannot override .gitignore',
});
