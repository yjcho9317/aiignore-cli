import { createIgnoreGenerator } from './cursorignore.js';

export const generateAiderignore = createIgnoreGenerator({
  toolId: 'aider',
  toolName: 'Aider',
  fileName: '.aiderignore',
  warnings: [
    'Aider respects .aiderignore with gitignore syntax.',
    'Can be overridden via --aiderignore flag or .aider.conf.yml.',
  ],
  message: 'Stable ignore mechanism',
});
