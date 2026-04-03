import { createIgnoreGenerator } from './cursorignore.js';

export const generateClineignore = createIgnoreGenerator({
  toolId: 'cline',
  toolName: 'Cline',
  fileName: '.clineignore',
  warnings: [
    'Cline respects .clineignore with gitignore syntax.',
    'Controls which files Cline can read and reference in context.',
  ],
  message: 'Stable ignore mechanism',
});
