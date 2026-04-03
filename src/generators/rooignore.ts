import { createIgnoreGenerator } from './cursorignore.js';

export const generateRooignore = createIgnoreGenerator({
  toolId: 'roo',
  toolName: 'Roo Code',
  fileName: '.rooignore',
  warnings: [
    'Roo Code respects .rooignore with gitignore syntax.',
    'Affects both tool access and context mentions.',
  ],
  message: 'Stable ignore mechanism',
});
