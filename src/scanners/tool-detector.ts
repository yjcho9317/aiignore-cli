import fs from 'node:fs';
import path from 'node:path';

export interface DetectedTool {
  name: string;
  id: string;
  detected: boolean;
  signals: string[];
}

const TOOL_SIGNALS: Record<string, { name: string; paths: string[] }> = {
  cursor: {
    name: 'Cursor',
    paths: ['.cursor/', '.cursorignore', '.cursorrules'],
  },
  claudeCode: {
    name: 'Claude Code',
    paths: ['.claude/', '.claude/settings.json', 'CLAUDE.md'],
  },
  copilot: {
    name: 'GitHub Copilot',
    paths: ['.github/copilot-instructions.md'],
  },
  geminiCli: {
    name: 'Gemini CLI',
    paths: ['.geminiignore', '.gemini/'],
  },
  jetbrains: {
    name: 'JetBrains AI',
    paths: ['.idea/', '.aiignore', '.aiexclude'],
  },
  windsurf: {
    name: 'Windsurf/Codeium',
    paths: ['.codeiumignore', '.windsurf/'],
  },
  aider: {
    name: 'Aider',
    paths: ['.aider.conf.yml', '.aiderignore', '.aider/'],
  },
};

export function detectTools(projectDir: string): DetectedTool[] {
  const results: DetectedTool[] = [];

  for (const [id, config] of Object.entries(TOOL_SIGNALS)) {
    const foundSignals: string[] = [];

    for (const signalPath of config.paths) {
      const fullPath = path.join(projectDir, signalPath);
      if (fs.existsSync(fullPath)) {
        foundSignals.push(signalPath);
      }
    }

    results.push({
      name: config.name,
      id,
      detected: foundSignals.length > 0,
      signals: foundSignals,
    });
  }

  return results;
}

export const ALL_TOOL_IDS = Object.keys(TOOL_SIGNALS);
