import { createIgnoreGenerator } from './cursorignore.js';

export const generateAiignoreJB = createIgnoreGenerator({
  toolId: 'jetbrains',
  toolName: 'JetBrains AI',
  fileName: '.aiignore',
  warnings: [
    'JetBrains native format. Also supports .aiexclude for compatibility.',
  ],
  message: 'Most reliable ignore mechanism',
});
