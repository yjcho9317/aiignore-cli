export const TOOL_ALIASES: Record<string, string> = {
  cursor: 'cursor',
  claude: 'claudeCode',
  'claude-code': 'claudeCode',
  claudecode: 'claudeCode',
  copilot: 'copilot',
  gemini: 'geminiCli',
  'gemini-cli': 'geminiCli',
  jetbrains: 'jetbrains',
  jb: 'jetbrains',
  windsurf: 'windsurf',
  codeium: 'windsurf',
  aider: 'aider',
};

export function resolveToolId(input: string): string | undefined {
  return TOOL_ALIASES[input.toLowerCase()];
}

export function resolveToolIds(input: string): { ids: string[]; invalid: string[] } {
  const parts = input.split(',').map((s) => s.trim()).filter(Boolean);
  const ids: string[] = [];
  const invalid: string[] = [];

  for (const part of parts) {
    const resolved = resolveToolId(part);
    if (resolved) {
      ids.push(resolved);
    } else {
      invalid.push(part);
    }
  }

  return { ids: [...new Set(ids)], invalid };
}
