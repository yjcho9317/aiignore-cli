export interface ToolIgnoreStatus {
  tool: string;
  ignoreFile: string;
  reliability: 'high' | 'medium' | 'low' | 'none';
  knownLimitations: string[];
  recommendedApproach: string;
  source: string;
}

export const TOOL_STATUS: Record<string, ToolIgnoreStatus> = {
  cursor: {
    tool: 'Cursor',
    ignoreFile: '.cursorignore',
    reliability: 'low',
    knownLimitations: [
      '"best-effort" — not guaranteed (official docs)',
      'CVE-2025-59944: case-sensitivity bypass',
      'CVE-2025-64110: agent rewrite bypass',
      'Agent mode can bypass via terminal commands',
      '@file reference ignores .cursorignore (user can attach protected files)',
    ],
    recommendedApproach: '.cursorignore file with gitignore syntax',
    source: 'https://docs.cursor.com/context/ignore-files',
  },
  claudeCode: {
    tool: 'Claude Code',
    ignoreFile: '.claude/settings.json',
    reliability: 'medium',
    knownLimitations: [
      'permissions.deny has enforcement bugs (#6699, #6631, #8961)',
      'Read() deny also blocks Bash cat (tested) — separate Bash deny not needed',
      '.claudeignore exists but only blocks Read tool',
    ],
    recommendedApproach: 'settings.json deny patterns + PreToolUse hooks',
    source: 'https://code.claude.com/docs/en/settings',
  },
  copilot: {
    tool: 'GitHub Copilot',
    ignoreFile: 'none',
    reliability: 'none',
    knownLimitations: [
      '.copilotignore does NOT exist',
      'Content Exclusion is Business/Enterprise only',
      'Not supported in Agent, Edit, or CLI modes',
      'Individual developers have NO file-level protection',
    ],
    recommendedApproach: 'No file-level protection available for individual developers',
    source: 'https://docs.github.com/en/copilot/managing-copilot/configuring-content-exclusions',
  },
  geminiCli: {
    tool: 'Gemini CLI',
    ignoreFile: '.geminiignore',
    reliability: 'low',
    knownLimitations: [
      'Negation patterns (!) are broken',
      'list_dir ignores .geminiignore in Antigravity mode',
      '.aiignore/.aiexclude NOT supported (only Gemini Code Assist IDE)',
      'Gemini CLI self-blocks .env, .pem, .env.local regardless of .geminiignore (built-in policy)',
    ],
    recommendedApproach: '.geminiignore file with gitignore syntax (avoid negation)',
    source: 'https://github.com/google-gemini/gemini-cli',
  },
  jetbrains: {
    tool: 'JetBrains AI',
    ignoreFile: '.aiignore',
    reliability: 'high',
    knownLimitations: [
      'Not 100% guaranteed (YouTrack LLM-17544)',
      'Claude Agent inside JetBrains may ignore .aiignore (LLM-20693)',
      'Sensitive-looking content (.env, .pem) may show REDACT instead of full block (AI policy overlap)',
    ],
    recommendedApproach: '.aiignore file (native) with gitignore syntax',
    source: 'https://www.jetbrains.com/help/ai-assistant/disable-ai-assistant.html',
  },
  windsurf: {
    tool: 'Windsurf/Codeium',
    ignoreFile: '.codeiumignore',
    reliability: 'medium',
    knownLimitations: [
      'Negation (!) cannot override .gitignore exclusions (Issue #133)',
      '"Allow Cascade to access .gitignore files" toggle does not work (Issue #225)',
      'Autocomplete blocking is indirect (via indexing), not explicitly documented',
      'Still uses .codeiumignore (not .windsurfignore)',
    ],
    recommendedApproach: '.codeiumignore file with gitignore syntax (avoid negation)',
    source: 'https://docs.windsurf.com/context-awareness/windsurf-ignore',
  },
};
